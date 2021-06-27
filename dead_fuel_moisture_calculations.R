setwd(".")

library(raster)
library(rgdal)

#Script used to create the dead fuel moisture layer for the area
#Associated pre-filtered spatial layers used in the script can be found in this Google drive folder (https://drive.google.com/drive/folders/1vuYNTo2inDC_fhoRgUwJ-32dY1Ki2MFe?usp=sharing)

#max temp
max_temp_tifs <- list.files(path= "./daily_max_tifs", full.names=TRUE,recursive=FALSE)
s_max_temp <- stack(max_temp_tifs)
mean_max_temp<-calc(s_max_temp, mean)

#relative humidity
rh_tifs <- list.files(path= "./rh_tifs", full.names=TRUE,recursive=FALSE)
s_rh <- stack(rh_tifs)
mean_rh <-calc(s_rh, mean)

#vapour pressure difference calculations
es = 0.6108 * exp(17.27* (mean_max_temp/(mean_max_temp +237.3)))
ea = (mean_rh/100) * es
D = es - ea
    
dead_fuel_FM <- 6.79 + 27.43*exp(-1.05*D)
raster::plot(D)
raster::plot(dead_fuel_FM)

#Writing the dead fuel moisture spatial raster
print(dead_fuel_FM)
writeRaster(dead_fuel_FM, "dead_fuel_FM.tif")