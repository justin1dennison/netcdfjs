;(async function () {
  const netcdf = await import('./src/netcdf.js')
  const NetCDF = netcdf.default.NetCDF
  const filename = "data/ECMWF_ERA-40_subset.nc"
  // const filename = 'data/example_1.nc'
  const nc = await NetCDF.fromFile(filename)
  for (let variable in nc.variables) {
    const { data } = nc.variables[variable]
    console.log({ variable, data })
  }
})().catch((e) => console.error(e))
