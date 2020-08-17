import ndarray from "ndarray"

export const frombuffer = (xs, { dtype, shape }) => {
  switch (dtype) {
    case "b":
      return ndarray(new Int8Array(xs), shape)
    case "c":
      return ndarray(xs, shape)
    case "h":
      return ndarray(new Int16Array(xs), shape)
    case "i":
      return ndarray(new Int32Array(xs), shape)
    case "d":
      return ndarray(new Float64Array(xs), shape)
    default:
      return ndarray(new Float32Array(xs), shape)
  }
}

const mod = (n, k) => ((n % k) + k) % k

const mul = (x, y) => x * y

const jsonify = (x, padding=2) => JSON.stringify(x, null, padding)

module.exports = { frombuffer, mod, mul, jsonify }
