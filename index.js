;(async function () {
  const { NetCDF } = require('./dist/lib')
  const filename = "data/ECMWF_ERA-40_subset.nc"
  //const filename = 'data/example_1.nc'
  const nc = await NetCDF.fromFile(filename)
  for(let variable of Object.values(nc.variables)) {
     console.log('%s', variable) 
  }
})().catch((e) => console.error(e))
