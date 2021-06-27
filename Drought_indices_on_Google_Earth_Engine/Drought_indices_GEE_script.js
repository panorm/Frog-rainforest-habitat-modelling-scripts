//The script can also be accessed directly through Google Earth Engine
//To do this, you first need to create an free account.
//Once this is complete click on this link to access the script (https://code.earthengine.google.com/8ba644beb6ae3e3009b9930200094108)

//Importing in species ranges, region and transect locations
var transects = ee.Collection.loadTable("users/patrickmnorman/frog_assets/All_philoria_transects"),
    region = ee.Geometry.Point(152.48,-28.70),
    all_distributions = ee.Collection.loadTable("users/patrickmnorman/frog_assets/Philoria_full_range_Geoffs"),
    northern_spp = ee.Collection.loadTable("users/patrickmnorman/frog_assets/Philoria_full_range_Geoffs");

//----------------------------------------------------------------------------------------------
//MAX AND MIN FOR VALUES TO ESTABLISH RANGE
// import data
var collection = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')
  .filterBounds(northern_spp)
  .filterMetadata('CLOUD_COVER', 'less_than', 20);
 
// Define dates
var iniDate = ee.Date.fromYMD(2014,8,1);
var endDate = ee.Date.fromYMD(2019,7,30);
 

var col_NDIIb6 = function(image) {
  return image.addBands(
    image.normalizedDifference(['B5', 'B6']).rename('NDIIb6'));
};

var col_VARI = function(image) {
  return  image.addBands(
  image.select('B3').subtract(image.select('B4'))
  .divide(image.select('B3').add(image.select('B4').subtract(image.select('B2'))))
  .rename('VARI'));
};

var getQABits = function(image, start, end, newName) {
    // Compute the bits we need to extract.
    var pattern = 0;
    for (var i = start; i <= end; i++) {
       pattern += Math.pow(2, i);
    }
    // Return a single band image of the extracted QA bits, giving the band
    // a new name.
    return image.select([0], [newName])
                  .bitwiseAnd(pattern)
                  .rightShift(start);
};

// A function to mask out cloudy pixels.
var cloud_shadows = function(image) {
  // Select the QA band.
  var QA = image.select(['pixel_qa']);
  // Get the internal_cloud_algorithm_flag bit.
  return getQABits(QA, 3,3, 'cloud_shadows').eq(0);
  // Return an image masking out cloudy areas.
};
// A function to mask out cloudy pixels.
var clouds = function(image) {
  // Select the QA band.
  var QA = image.select(['pixel_qa']);
  // Get the internal_cloud_algorithm_flag bit.
  return getQABits(QA, 5,5, 'Cloud').eq(0);
  // Return an image masking out cloudy areas.
};

var maskClouds = function(image) {
  var cs = cloud_shadows(image);
  var c = clouds(image);
  image = image.updateMask(cs);
  return image.updateMask(c);
};

// create cloud free composite
var noCloud = collection.filterDate(iniDate,endDate)
  .map(col_NDIIb6).map(col_VARI)
  .map(maskClouds);
 
print(noCloud);
var reducer = noCloud.reduce(ee.Reducer.mean());
print(reducer);

//----------------------------------------------------------------------------------------------
//EACH MONTHS VALUES AND FINAL EQUATIONS

//var month = DEC;

// Define dates
var iniDate_perMonth = ee.Date.fromYMD(2019,8,1);
var endDate_perMonth = ee.Date.fromYMD(2019,9,30);

// monthly calculations
var noCloud_month = collection.filterDate(iniDate_perMonth,endDate_perMonth)
  .map(col_NDIIb6).map(col_VARI)
  .map(maskClouds);

// VARI calcs

var VARI_max = noCloud.select(['VARI']).max();
var VARI_min = noCloud.select(['VARI']).min();
var VARI_b4fire = noCloud_month.select(['VARI']).mode();

var VARI_SI = VARI_b4fire.expression('(VARI_b4fire - VARI_min)/(VARI_max - VARI_min)', {
  'VARI_b4fire': VARI_b4fire,
  'VARI_min': VARI_min,
  'VARI_max': VARI_max});

//print(VARI_max);
Map.addLayer(VARI_SI,{},'VARI_SI');
Map.addLayer(VARI_max,{},'VARI_max');
Map.addLayer(VARI_min,{},'VARI_min');

// NDIIb6 calcs

var NDIIb6_max = noCloud.select(['NDIIb6']).max();
var NDIIb6_min = noCloud.select(['NDIIb6']).min();
var NDIIb6_b4fire = noCloud_month.select(['NDIIb6']).mode();

var NDIIb6_SI = VARI_b4fire.expression('(NDIIb6_b4fire - NDIIb6_min)/(NDIIb6_max - NDIIb6_min)', {
  'NDIIb6_b4fire': NDIIb6_b4fire,
  'NDIIb6_min': NDIIb6_min,
  'NDIIb6_max': NDIIb6_max});

//print(VARI_max);
Map.addLayer(NDIIb6_SI,{},'NDIIb6_SI');

//Clipping the distributions
var VARI_clip = VARI_SI.clip(northern_spp);
var NDIIb6_clip = NDIIb6_SI.clip(northern_spp);

// Export the image, specifying scale and region.
Export.image.toDrive({
  image: VARI_clip,
  description: 'VARI_SI_prefire_newClip',
  scale:30,
  maxPixels: 1e13
});

// Export the image, specifying scale and region.
Export.image.toDrive({
  image: NDIIb6_clip,
  description: 'NDIIb6_SI_prefire_newClip',
  scale:30,
  maxPixels: 1e13
});