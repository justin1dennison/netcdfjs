const { promises: fs } = require("fs")
const ndarray = require("ndarray")
const Bytes  = require('./bytes')

const ABSENT = "\x00\x00\x00\x00\x00\x00\x00\x00"
const ZERO = "\x00\x00\x00\x00"
const NC_BYTE = "\x00\x00\x00\x01"
const NC_CHAR = "\x00\x00\x00\x02"
const NC_SHORT = "\x00\x00\x00\x03"
const NC_INT = "\x00\x00\x00\x04"
const NC_FLOAT = "\x00\x00\x00\x05"
const NC_DOUBLE = "\x00\x00\x00\x06"
const NC_DIMENSION = "\x00\x00\x00\n"
const NC_VARIABLE = "\x00\x00\x00\x0b"
const NC_ATTRIBUTE = "\x00\x00\x00\x0c"
const STREAMING = "\xFF\xFF\xFF\xFF"
const CLASSIC_FORMAT = "classic format"
const OFFSET_FORMAT_64_BIT = "64-bit offset format"
const FORMATS = [CLASSIC_FORMAT, OFFSET_FORMAT_64_BIT]
const FORMATCODES = { 1: CLASSIC_FORMAT, 2: OFFSET_FORMAT_64_BIT }
const TYPEMAP = {
  [NC_BYTE]: ["b", 1],
  [NC_CHAR]: ["c", 1],
  [NC_SHORT]: ["h", 2],
  [NC_INT]: ["i", 4],
  [NC_FLOAT]: ["f", 4],
  [NC_DOUBLE]: ["d", 8],
}
const fromstring = (xs, { dtype }) => {
  if (dtype === "i") return ndarray(new Int32Array(xs))
  if (dtype === "f") return ndarray(new Float32Array(xs))
  return ndarray(new Float64Array(xs))
}


const mod = (n, k) => ((n % k) + k) % k


class NetCDF {
  constructor(source) {
    this.dimensions = {}
    this.variables = {}
    this.attrs = {}
    this._dims = []
    this._recs = []
    this._recsize = 0
    this.bytes = Bytes(source)
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
    if(header !== ZERO && header !== NC_VARIABLE) throw new Error('Malformed variable')
    let begin = 0
    const dtypes = { names: [], formats: [] }
    const recordVars = []
    const count = this.bytes.int32()
    for(let i = 0; i < count; i++) {
      const { name, dimensions, shape, attributes, typecode, size, dtype, begin_, vsize } = this._readVar()
      //TODO: Complete the variable portion
      this.variables[name] = { name, dimensions, shape, attributes, typecode, size, dtype, begin, vsize } 
    }
  }
  _readVar() {
    const name = this._readString()
    const dimensions = []
    const shape = []
    const dims = this.bytes.int32()
    for(let i = 0; i < dims; i++) {
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
    return { name, dimensions, shape, attributes, typecode, size, dtype, begin, vsize }
    
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
    this.isStreaming = this.bytes.string({ length: 4 }) === STREAMING
    this.bytes.rewind(4)
    this.numRecs = this.isStreaming ? STREAMING : this.bytes.int32()
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
