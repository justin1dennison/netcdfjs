const { SeekFrom, Endian } = require("./constants")

const ByteReader = (buffer, { endian = Endian.BIG } = {}) => ({
  endian,
  buffer,
  position: 0,
  seek(n, { whence = SeekFrom.ABSOLUTE } = {}) {
    if (whence === SeekFrom.ABSOLUTE) this.position = n
    else if (whence === SeekFrom.RELATIVE) this.position += n
    else this.position = this.buffer.length - n
  },
  rewind(n) {
    this.seek(-n, { whence: SeekFrom.RELATIVE })
  },
  forward(n) {
    this.seek(n, { whence: SeekFrom.RELATIVE })
  },
  string({ length }) {
    return this.read(length).toString()
  },
  read(n) {
    const data = this.buffer.slice(this.position, this.position + n)
    this.forward(n)
    return data
  },
  double() {
    return this.endian === Endian.BIG
      ? this.read(8).readDoubleBE()
      : this.read(8).readDoubleLE()
  },
  float() {
    return this.endian === Endian.BIG
      ? this.read(4).readFloatBE()
      : this.read(4).readFloatLE()
  },
  int8() {
    return this.read(1).readInt8()
  },
  int16() {
    return this.endian === Endian.BIG
      ? this.read(4).readInt16BE()
      : this.read(4).readInt16LE()
  },
  int32() {
    return this.endian === Endian.BIG
      ? this.read(4).readInt32BE()
      : this.read(4).readInt32LE()
  },
  int64() {
    return this.endian === Endian.BIG
      ? this.read(8).readInt64BE()
      : this.read(8).readInt64LE()
  },
  uint8() {
    return this.read(1).readUInt8()
  },
  uint16() {
    return this.endian === Endian.BIG
      ? this.read(4).readUInt16BE()
      : this.read(4).readUInt16LE()
  },
  uint32() {
    return this.endian === Endian.BIG
      ? this.read(4).readUInt32BE()
      : this.read(4).readUInt32LE()
  },
  uint64() {
    return this.endian === Endian.BIG
      ? this.read(8).readUInt64BE()
      : this.read(8).readUInt64LE()
  },
})

module.exports = { ByteReader }
