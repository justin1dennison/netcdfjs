(async function () {
  const netcdf = await import("./src/netcdf.js");
  const NetCDF = netcdf.default.NetCDF;
  const filename = "./data/example_1.nc";
  const nc = await NetCDF.fromFile(filename);
  console.log({ nc })
  console.log(nc.variables)
})().catch(e => console.error(e))
