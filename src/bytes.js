const { SeekFrom, Endian } = require("./constants")

const Bytes = (buffer, { endian = Endian.BIG } = {}) => ({
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
  uint32() {
    return this.endian === Endian.BIG
      ? this.read(4).readUInt32BE()
      : this.read(4).readUInt32LE()
  },
})

module.exports = Bytes
