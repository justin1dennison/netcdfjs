const ndarray = require("ndarray")

const fromstring = (xs, { dtype }) => {
  if (dtype === "i") return ndarray(new Int32Array(xs))
  if (dtype === "f") return ndarray(new Float32Array(xs))
  return ndarray(new Float64Array(xs))
}

const mod = (n, k) => ((n % k) + k) % k

module.exports = { fromstring, mod }
