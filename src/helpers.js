const ndarray = require("ndarray")

const frombuffer = (xs, { dtype }) => {
  switch (dtype) {
    case "b":
      return ndarray(new Int8Array(xs))
    case "c":
      return ndarray(xs)
    case "h":
      return ndarray(new Int16Array(xs))
    case "i":
      return ndarray(new Int32Array(xs))
    case "d":
      return ndarray(new Float64Array(xs))
    default:
      return ndarray(new Float32Array(xs))
  }
}

const mod = (n, k) => ((n % k) + k) % k

const mul = (x, y) => x * y

module.exports = { frombuffer, mod, mul }
