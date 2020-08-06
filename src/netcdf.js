const { promises: fs } = require('fs')
const ndarray = require('ndarray')
const { ByteReader } = require('./bytes')
const { mul, mod, frombuffer } = require('./helpers')
const {
  ABSENT,
  ZERO,
  NC_DIMENSION,
  NC_VARIABLE,
  NC_ATTRIBUTE,
  STREAMING,
  FORMATCODES,
  TYPEMAP,
} = require('./constants')

class NetCDF {
  constructor(source) {
    this.dimensions = {}
    this.variables = {}
    this.attrs = {}
    this._dims = []
    this._recs = 0
    this._recsize = 0
    this.bytes = ByteReader(source)
    this.magic = this.bytes.string({ length: 3 })
    this.version = this.bytes.int8()
    this.format = FORMATCODES[this.version]
    this.useMMap = false //this will be changed later
    this.readNumRecs()
    this.readDimArray()
    this.readGAttArray()
    this.readVarArray()
  }
  readVarArray() {
    const header = this.bytes.string({ length: 4 })
    if (header !== ZERO && header !== NC_VARIABLE)
      throw new Error('Malformed variable')
    const count = this.bytes.int32()
    for (let i = 0; i < count; i++) {
      const {
        name,
        dimensions,
        shape,
        typecode,
        attributes,
        size,
        dtype,
        begin,
        vsize,
      } = this._readVar()
      const actualSize = [...shape, size].reduce(mul)
      const position = this.bytes.position
      this.bytes.seek(begin)
      const data = frombuffer(this.bytes.read(actualSize), { dtype, shape })
      this.bytes.seek(position)
      this.variables[name] = NetCDFVariable.from({
        data,
        name,
        dimensions,
        shape,
        attributes,
        size,
        typecode,
        dtype,
        begin,
        vsize,
      })
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
      shape: shape[0] === 0 ? shape.slice(1) : shape,
      attributes,
      size,
      typecode,
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
      throw new Error('Unexpected Attribute Header')
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

    if (typecode !== 'c') {
      values = frombuffer(values, { dtype: typecode })
      if (values.shape.length === 1 && values.shape[0] === 1) {
        values = values[0]
      }
    } else {
      values = values.toString().trimRight('\x00')
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
        throw new Error('Invalid NC Dimension')
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

class NetCDFVariable {
  constructor(data, typecode, size, shape, dimensions, attributes = {}) {
    this.data = data
    this.typecode = typecode
    this.size = size
    this.shape = shape
    this.dimensions = dimensions
    this.attributes = attributes
  }
  static from({
    data,
    typecode,
    size,
    shape,
    dimensions,
    attributes = {},
  } = {}) {
    return new NetCDFVariable(
      data,
      typecode,
      size,
      shape,
      dimensions,
      attributes
    )
  }
}

module.exports = {
  NetCDF,
}
