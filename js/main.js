var MAP_CENTER = [0.5, 39];
var MAP_ZOOM = 6;

var layers = {};

$(function () {

  window.map = L.map('map', {
    scrollWheelZoom: false,
    center: MAP_CENTER,
    zoom: MAP_ZOOM
  });

  require('./controls/info-control').addTo(map);
  require('./controls/legend-control').addTo(map);
  require('./controls/cluster-control').addTo(map);

  layers.tiles = require('./layers/tiles-layer');
  layers.markers = require('./layers/markers-layer')();
  layers.clusters = require('./layers/clusters-layer')();
  layers.counties = require('./layers/counties-layer')();

  layers.tiles.addTo(map);
  layers.markers.addTo(map);
  layers.counties.addTo(map);

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

  require('./services/projects-service').fetchAll();
  require('./services/counties-service').fetchAll();

});
