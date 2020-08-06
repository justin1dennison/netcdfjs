const { promises: fs } = require("fs")
const ndarray = require("ndarray")
const { ByteReader } = require("./bytes")
const { mod, fromstring } = require("./helpers")
const {
  ABSENT,
  ZERO,
  NC_BYTES,
  NC_CHAR,
  NC_SHORT,
  NC_INT,
  NC_FLOAT,
  NC_DOUBLE,
  NC_DIMENSION,
  NC_VARIABLE,
  NC_ATTRIBUTE,
  STREAMING,
  CLASSIC_FORMAT,
  OFFSET_FORMAT_64_BIT,
  FORMATS,
  FORMATCODES,
  TYPEMAP,
} = require("./constants")

class NetCDF {
  constructor(source) {
    this.dimensions = {}
    this.variables = {}
    this.attrs = {}
    this._dims = []
    this._recs = []
    this._recsize = 0
    this.bytes = ByteReader(source)
    this.magic = this.bytes.string({ length: 3 })
    this.version = this.bytes.int8()
    this.format = FORMATCODES[this.version]
    this.readNumRecs()
    this.readDimArray()
    this.readGAttArray()
    this.readVarArray()
  }
  readVarArray() {
    const header = this.bytes.string({ length: 4 })
    if (header !== ZERO && header !== NC_VARIABLE)
      throw new Error("Malformed variable")
    let begin = 0
    const dtypes = { names: [], formats: [] }
    const recordVars = []
    const count = this.bytes.int32()
    for (let i = 0; i < count; i++) {
      const {
        name,
        dimensions,
        shape,
        attributes,
        typecode,
        size,
        dtype,
        begin_,
        vsize,
      } = this._readVar()
      //TODO: Complete the variable portion
      this.variables[name] = {
        name,
        dimensions,
        shape,
        attributes,
        typecode,
        size,
        dtype,
        begin,
        vsize,
      }
    }
  }
  _readVar() {
    const name = this._readString()
    const dimensions = []
    const shape = []
    const dims = this.bytes.int32()
    for (let i = 0; i < dims; i++) {
      const dimid = this.bytes.int32()
      const dimname = this._dims[dimid]
      dimensions.push(dimname)
      const dim = this.dimensions[dimname]
      shape.push(dim)
    }
    const attributes = this.readAttArray()
    const ncType = this.bytes.read(4)
    const vsize = this.bytes.int32()
    const begin = this.version === 1 ? this.bytes.int32() : this.bytes.int64()
    const [typecode, size] = TYPEMAP[ncType]
    const dtype = `>${typecode}`
    return {
      name,
      dimensions,
      shape,
      attributes,
      typecode,
      size,
      dtype,
      begin,
      vsize,
    }
  }
  readGAttArray() {
    for (let [k, v] of Object.entries(this.readAttArray())) {
      this.attrs[k] = v
    }
  }
  readAttArray() {
    const header = this.bytes.string({ length: 4 })
    if (header !== ZERO && header !== NC_ATTRIBUTE)
      throw new Error("Unexpected Attribute Header")
    const count = this.bytes.int32()
    const attrs = {}
    for (let i = 0; i < count; i++) {
      const name = this._readString()
      attrs[name] = this._readValues()
    }
    return attrs
  }
  _readString() {
    const count = this.bytes.uint32()
    const name = this.bytes.string({ length: count })
    this.bytes.read(mod(-count, 4))
    return name
  }
  _readValues() {
    const type = this.bytes.string({ length: 4 })
    const n = this.bytes.int32()
    const [typecode, size] = TYPEMAP[type]
    const count = n * size
    let values = this.bytes.read(parseInt(count))

    if (typecode !== "c") {
      values = fromstring(values, { dtype: typecode })
      if (values.shape.length === 1 && values.shape[0] === 1) {
        values = values[0]
      }
    } else {
      values = values.toString().trimRight("\x00")
    }
    this.bytes.read(mod(-count, 4))
    return values
  }

  readNumRecs() {
    this.streaming = this.bytes.string({ length: 4 }) === STREAMING
    this.bytes.rewind(4)
    this.numRecs = this.streaming ? STREAMING : this.bytes.int32()
  }
  readDimArray() {
    this.absentDimList = this.bytes.string({ length: 8 }) === ABSENT
    if (!this.absentDimList) {
      this.bytes.rewind(8)
      this.ncDimension = this.bytes.string({ length: 4 })
      if (this.ncDimension !== NC_DIMENSION)
        throw new Error("Invalid NC Dimension")
      const count = this.bytes.int32()
      for (let i = 0; i < count; i++) {
        const name = this._readString()
        const length = this.bytes.int32()
        this.dimensions[name] = length
        this._dims.push(name)
      }
    }
  }

  static async fromFile(filepath) {
    const source = await fs.readFile(filepath)
    return new NetCDF(source)
  }
}

module.exports = {
  NetCDF,
}
