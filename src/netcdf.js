import { promises as fs } from 'fs'
import util from 'util'
import { ByteReader } from '@justin1dennison/bytesjs'
import { mul, mod, frombuffer, jsonify } from './helpers'
import {
  ABSENT,
  ZERO,
  NC_DIMENSION,
  NC_VARIABLE,
  NC_ATTRIBUTE,
  STREAMING,
  FORMATCODES,
  TYPEMAP,
} from './constants'

const string = (reader) => {
  const length = reader.uint32()
  const name = reader.string({ length })
  reader.read(mod(-length, 4))
  return name
}

const numrecs = (reader) => {
  const streaming = reader.string({ length: 4 }) === STREAMING
  reader.rewind(4)
  const numRecs = streaming ? STREAMING : reader.int32()
  return { streaming, numRecs }
}

const dimensions = (reader) => {
  const absentDimList = reader.string({ length: 8 }) === ABSENT
  const dimensions = {}
  const _dims = []
  if (!absentDimList) {
    reader.rewind(8)
    const ncDimension = reader.string({ length: 4 })
    if (ncDimension !== NC_DIMENSION) throw new Error('Invalid NC Dimension')
    const count = reader.int32()
    for (let i = 0; i < count; i++) {
      const name = string(reader)
      const length = reader.int32()
      dimensions[name] = length
      _dims.push(name)
    }
  }
  return { absentDimList, dimensions, _dims }
}

const values = (reader) => {
  const type = reader.string({ length: 4 })
  const n = reader.int32()
  const [typecode, size] = TYPEMAP[type]
  const count = n * size
  let values = reader.read(parseInt(count))

  if (typecode !== 'c') {
    values = frombuffer(values, { dtype: typecode })
    if (values.shape.length === 1 && values.shape[0] === 1) {
      values = values[0]
    }
  } else {
    values = values.toString().trimRight('\x00')
  }
  reader.read(mod(-count, 4))
  return values
}

const attrs = (reader) => {
  const attrs = {}
  const header = reader.string({ length: 4 })
  if (header !== ZERO && header !== NC_ATTRIBUTE)
    throw new Error('Unexpected Attribute Header')
  const count = reader.int32()
  for (let i = 0; i < count; i++) {
    const name = string(reader)
    attrs[name] = values(reader)
  }
  return attrs
}
const gattrs = (reader) => {
  return Object.entries(attrs(reader)).reduce((acc, n) => {
    const [k, v] = n
    acc[k] = v
    return acc
  }, {})
}

const variable = (reader, { _dims, dimensions, version }) => {
  const name = string(reader)
  const ds = []
  const shape = []
  const dims = reader.int32()
  for (let i = 0; i < dims; i++) {
    const dimid = reader.int32()
    const dimname = _dims[dimid]
    ds.push(dimname)
    const dim = dimensions[dimname]
    shape.push(dim)
  }
  const attributes = attrs(reader)
  const ncType = reader.read(4)
  const vsize = reader.int32()
  const begin = version === 1 ? reader.int32() : reader.int64()
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

const variables = (reader, dataset) => {
  const header = reader.string({ length: 4 })
  const variables = {}
  if (header !== ZERO && header !== NC_VARIABLE)
    throw new Error('Malformed variable')
  const count = reader.int32()
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
    } = variable(reader, dataset)
    const actualSize = [...shape, size].reduce(mul)
    const position = reader.position
    reader.seek(begin)
    const data = frombuffer(reader.read(actualSize), { dtype, shape })
    reader.seek(position)
    variables[name] = {
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
    }
  }
  return variables
}

export class NetCDF {
  constructor(source) {
    this.reader = ByteReader.of(source)
    //TODO: Add validation
    const magic = this.reader.string({ length: 3 })
    const version = this.reader.int8()
    const format = FORMATCODES[version]
    Object.assign(
      this,
      { magic, version, format },
      numrecs(this.reader),
      dimensions(this.reader),
      { attrs: gattrs(this.reader) },
      // { variables: variables(this.reader, this) }
    )
  }
  static async fromFile(filepath) {
    const source = await fs.readFile(filepath)
    return new NetCDF(source)
  }
}

class NetCDFVariable {
  constructor(name, data, typecode, size, shape, dimensions, attributes = {}) {
    this.name = name
    this.data = data
    this.typecode = typecode
    this.size = size
    this.dimensions = dimensions
    this.attributes = attributes
  }
  static from({
    name,
    data,
    typecode,
    size,
    shape,
    dimensions,
    attributes = {},
  } = {}) {
    return new NetCDFVariable(
      name,
      data,
      typecode,
      size,
      shape,
      dimensions,
      attributes
    )
  }
  get shape() {
    return this.data.shape
  }
  get(...idxs) {
    return this.data.get(...idxs)
  }
  toString() {
    return `
    NetCDFVariable(${this.name})
	Shape: ${this.shape}
	Size: ${this.size}
	Dimensions: ${this.dimensions}
	Attributes: ${jsonify(this.attributes, 10)}
	`
  }
}
