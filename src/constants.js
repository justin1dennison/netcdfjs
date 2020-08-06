const SeekFrom = {
  ABSOLUTE: 0,
  RELATIVE: 1,
  END: 2,
}

const Endian = {
  LITTLE: "little",
  BIG: "big",
}

Object.freeze(SeekFrom)
Object.freeze(Endian)
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

module.exports = {
  ABSENT,
  ZERO,
  NC_BYTE,
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
  SeekFrom,
  Endian,
}
