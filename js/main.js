var MAP_CENTER = [0.5, 39];
var MAP_ZOOM = 6;

$(function () {

  var layers = {}, controls = {};

  window.map = L.map('map', {
    scrollWheelZoom: false,
    center: MAP_CENTER,
    zoom: MAP_ZOOM
  });

  layers.tiles = require('./layers/tiles-layer');
  layers.markers = require('./layers/markers-layer')();
  layers.clusters = require('./layers/clusters-layer')();
  layers.projectsPerCounty = require('./layers/counties-layer')();
  layers.avgCostPerCounty = require('./layers/avgcost-layer')();

  layers.tiles.addTo(map);
  layers.markers.addTo(map);
  layers.projectsPerCounty.addTo(map);
  layers.avgCostPerCounty.addTo(map);

  var filterGroups = {
    all: require('./filters/all-filter')(),
    overtime: require('./filters/overtime-filter')()
  };

  controls.info = require('./controls/info-control');
  controls.legend = require('./controls/legend-control');
  controls.cluster = require('./controls/cluster-control');
  controls.filter = require('./controls/filtered-layer-control')(filterGroups);
  controls.counties = require('./controls/county-layer-control')([layers.projectsPerCounty, layers.avgCostPerCounty]);
  
  controls.info.addTo(map);
  controls.legend.addTo(map);
  controls.cluster.addTo(map);
  controls.filter.addTo(map);
  controls.counties.addTo(map);

  map.on('hideLayer', function (e) {
    if (layers[e.layer]) {
      map.removeLayer(layers[e.layer]);
    }
  });

  map.on('showLayer', function (e) {
    if (layers[e.layer]) {
      map.addLayer(layers[e.layer]);
    }
  });

  map.on('hideControl', function (e) {
    if (controls[e.control]) {
      map.removeControl(controls[e.control]);
    }
  });

  map.on('showControl', function (e) {
    if (controls[e.control]) {
      map.addControl(controls[e.control]);
    }
  });

  require('./services/projects-service').fetchAll();
  require('./services/counties-service').fetchAll();

});
