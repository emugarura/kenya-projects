var choroplethUtils = require('../util/choropleth-utils');

var countiesLayer, countiesData, projects;

function getProjectCountForCounty(name) {
  var count = 0;

  for (var i=0; i<projects.length; i++) {
    if (projects[i].marker && projects[i].county === name) {
      count++;
    }
  }

  return count;
}

function style(feature) {
  return {
    fillColor: choroplethUtils.projectCountToColour(getProjectCountForCounty(feature.properties.COUNTY_NAM)),
    weight: 2,
    opacity: 1,
    color: 'white',
    dashArray: '3',
    fillOpacity: 0.7
  };
}

function zoomToFeature(e) {
  map.fitBounds(e.target.getBounds());
}

function onEachFeature(feature, layer) {
  layer.on({
    click: zoomToFeature
  });
}

function drawGeoJSON() {
  countiesLayer.clearLayers();

  var l = L.geoJson(countiesData, {
    style: style,
    onEachFeature: onEachFeature
  });

  l.addTo(countiesLayer);
}

function onDataReceived (e) {
  if (e.dataType === 'counties' && e.data) {
    countiesData = e.data;
  } else if (e.dataType === 'projects' && e.data && e.data.length) {
    projects = e.data;
  }

  if (countiesData && projects) {
    drawGeoJSON();
  }
}

module.exports = function () {
  countiesLayer = L.layerGroup();

  window.map.on('dataReceived', onDataReceived);

  return countiesLayer;
};

