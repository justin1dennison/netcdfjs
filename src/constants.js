export const SeekFrom = {
  ABSOLUTE: 0,
  RELATIVE: 1,
  END: 2,
}

export const Endian = {
  LITTLE: "little",
  BIG: "big",
}

Object.freeze(SeekFrom)
Object.freeze(Endian)

export const ABSENT = "\x00\x00\x00\x00\x00\x00\x00\x00"
export const ZERO = "\x00\x00\x00\x00"
export const NC_BYTE = "\x00\x00\x00\x01"
export const NC_CHAR = "\x00\x00\x00\x02"
export const NC_SHORT = "\x00\x00\x00\x03"
export const NC_INT = "\x00\x00\x00\x04"
export const NC_FLOAT = "\x00\x00\x00\x05"
export const NC_DOUBLE = "\x00\x00\x00\x06"
export const NC_DIMENSION = "\x00\x00\x00\n"
export const NC_VARIABLE = "\x00\x00\x00\x0b"
export const NC_ATTRIBUTE = "\x00\x00\x00\x0c"
export const STREAMING = "\xFF\xFF\xFF\xFF"
export const CLASSIC_FORMAT = "classic format"
export const OFFSET_FORMAT_64_BIT = "64-bit offset format"
export const FORMATS = [CLASSIC_FORMAT, OFFSET_FORMAT_64_BIT]
export const FORMATCODES = { 1: CLASSIC_FORMAT, 2: OFFSET_FORMAT_64_BIT }
export const TYPEMAP = {
  [NC_BYTE]: ["b", 1],
  [NC_CHAR]: ["c", 1],
  [NC_SHORT]: ["h", 2],
  [NC_INT]: ["i", 4],
  [NC_FLOAT]: ["f", 4],
  [NC_DOUBLE]: ["d", 8],
}
