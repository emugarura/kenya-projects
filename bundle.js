(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var isClusteringEnabled = false;

module.exports = L.easyButton('fa-map-marker', function(btn, map) {

  if (isClusteringEnabled) {
    window.map.fireEvent('hideLayer', {layer: 'clusters'});
    window.map.fireEvent('showLayer', {layer: 'markers'});
    window.map.fireEvent('showControl', {control: 'filter'});
  } else {
    window.map.fireEvent('hideLayer', {layer: 'markers'});
    window.map.fireEvent('showLayer', {layer: 'clusters'});
    window.map.fireEvent('hideControl', {control: 'filter'});
  }

  isClusteringEnabled = !isClusteringEnabled;

});


},{}],2:[function(require,module,exports){
module.exports = function (filterGroups) {

  var groupedOverlays = {
    "Filter": {
      "On Time Projects": filterGroups.all,
      "Overdue Projects": filterGroups.overtime
    }
  };

  var options = {
    position: 'bottomleft',
    exclusiveGroups: ['Filter']
  };

  return L.control.groupedLayers({}, groupedOverlays, options);
};


},{}],3:[function(require,module,exports){
var infoControl = L.control({position: 'topright'});

infoControl.update = function (e) {
  var project = e ? e.project : undefined;
  
  this._div.innerHTML =  (project ?
    '<h4>' + (project.title ? project.title : 'Project in ' + project.constituency) + '</h4>' +
      (project.description ? '<p>' + project.description + '</p>' : '<p>No Description</p>') +
      (project.objectives ? '<h5>Objectives</h5><p>' + project.objectives + '</p>' : '') 
  : '<h4>Donor and Government Funded Projects in Kenya</h4>');
};

infoControl.onAdd = function (map) {
  this._div = L.DomUtil.create('div', 'info project-info');

  window.map.on('showProjectDetails', infoControl.update.bind(this));

  infoControl.update();

  return this._div;
};

module.exports = infoControl;

},{}],4:[function(require,module,exports){
var projectCountToColour = require('../util/choropleth-utils').projectCountToColour;

var legendControl = L.control({position: 'bottomright'});

legendControl.onAdd = function (map) {

  var div = L.DomUtil.create('div', 'info legend'),
  grades = [0, 10, 20, 30, 40, 50],
  labels = [],
  from, to;

  for (var i = 0; i < grades.length; i++) {
    from = grades[i];
    to = grades[i + 1];

    labels.push(
      '<i style="background:' + projectCountToColour(from + 1) + '"></i> ' +
        from + (to ? '&ndash;' + to : '+'));
  }

  div.innerHTML = '<h4>Legend</h4><h5>Projects per County</h5>' + labels.join('<br>');
  return div;
};

module.exports = legendControl;


},{"../util/choropleth-utils":14}],5:[function(require,module,exports){
var group = L.layerGroup();

var onDataReceived = function (e) {
  if (e.dataType === 'projects' && e.data && e.data.length) {
    var projects = e.data;

    for (var i=0; i<projects.length; i++) {
      if (projects[i].marker) {
        projects[i].marker.addTo(group);
      }
    }
  }
};

module.exports = function () {
  window.map.on('dataReceived', onDataReceived);
  return group;
};


},{}],6:[function(require,module,exports){
var group = L.layerGroup();

var onDataReceived = function (e) {
  if (e.dataType === 'projects' && e.data && e.data.length) {
    var projects = e.data;

    for (var i=0; i<projects.length; i++) {
      if (projects[i].marker) {
        if (projects[i].endDatePlanned &&
          !projects[i].endDateActual &&
          moment(projects[i].endDatePlanned).isBefore(moment())) {
          projects[i].marker.addTo(group);
        }
      }
    }
  }
};

module.exports = function () {
  window.map.on('dataReceived', onDataReceived);
  return group;
};


},{}],7:[function(require,module,exports){
var clustersLayer;

var onDataReceived = function (e) {
  if (e.dataType === 'projects' && e.data && e.data.length) {
    var projects = e.data;

    for (var i=0; i<projects.length; i++) {
      if (projects[i].marker) {
        clustersLayer.addLayer(projects[i].marker);
      }
    }
  }
};

module.exports = function () {

  clustersLayer = L.markerClusterGroup({showCoverageOnHover: false, zoomToBoundsOnClick: true});

  window.map.on('dataReceived', onDataReceived);

  return clustersLayer;
};


},{}],8:[function(require,module,exports){
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


},{"../util/choropleth-utils":14}],9:[function(require,module,exports){
var markersLayer;

var mkHoverFunction = function (project) {
  return function () {
    window.map.fireEvent('showProjectDetails', {project: project});
  };
};

var onDataReceived = function (e) {

  if (e.dataType === 'projects' && e.data && e.data.length) {

    var projects = e.data;

    for (var i=0; i<projects.length; i++) {
      if (projects[i].lng && projects[i].lat) {
        projects[i].marker = L.marker([projects[i].lat, projects[i].lng]);

        projects[i].marker.on('mouseover', mkHoverFunction(projects[i]));
        projects[i].marker.on('mouseout', mkHoverFunction(null));

        markersLayer.addLayer(projects[i].marker);
      }
    }
  }

};

module.exports = function () {
  markersLayer = L.layerGroup();

  window.map.on('dataReceived', onDataReceived);

  return markersLayer;
};


},{}],10:[function(require,module,exports){
module.exports = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
});

},{}],11:[function(require,module,exports){
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
  layers.counties = require('./layers/counties-layer')();

  layers.tiles.addTo(map);
  layers.markers.addTo(map);
  layers.counties.addTo(map);

  var filterGroups = {
    all: require('./filters/all-filter')(),
    overtime: require('./filters/overtime-filter')()
  };

  controls.info = require('./controls/info-control');
  controls.legend = require('./controls/legend-control');
  controls.cluster = require('./controls/cluster-control');
  controls.filter = require('./controls/filtered-layer-control')(filterGroups);
  
  controls.info.addTo(map);
  controls.legend.addTo(map);
  controls.cluster.addTo(map);
  controls.filter.addTo(map);

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

},{"./controls/cluster-control":1,"./controls/filtered-layer-control":2,"./controls/info-control":3,"./controls/legend-control":4,"./filters/all-filter":5,"./filters/overtime-filter":6,"./layers/clusters-layer":7,"./layers/counties-layer":8,"./layers/markers-layer":9,"./layers/tiles-layer":10,"./services/counties-service":12,"./services/projects-service":13}],12:[function(require,module,exports){
window.data = window.data || {};

module.exports.fetchAll = function () {

  $.get('/data/counties.json').then(function (data) {

    window.map.fireEvent('dataReceived', {dataType: 'counties', data: data});

  }, function (err) {

    alert('Could not fetch counties JSON.');

  });

};

},{}],13:[function(require,module,exports){
window.data = window.data || {};

module.exports.fetchAll = function () {

  $.get('/data/projects.json').then(function (data) {

    window.map.fireEvent('dataReceived', {dataType: 'projects', data: data.projects});

  }, function (err) {

    alert('Could not fetch projects JSON.');

  });

};

},{}],14:[function(require,module,exports){
module.exports.projectCountToColour = function (d) {
  return d > 50 ? '#810f7c' :
  d > 40  ? '#8856a7' :
  d > 30   ? '#8c96c6' :
  d > 20   ? '#9ebcda' :
  d > 10   ? '#bfd3e6' :
  '#edf8fb';
};


},{}]},{},[11])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy5udm0vdmVyc2lvbnMvbm9kZS92NS4xLjAvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwianMvY29udHJvbHMvY2x1c3Rlci1jb250cm9sLmpzIiwianMvY29udHJvbHMvZmlsdGVyZWQtbGF5ZXItY29udHJvbC5qcyIsImpzL2NvbnRyb2xzL2luZm8tY29udHJvbC5qcyIsImpzL2NvbnRyb2xzL2xlZ2VuZC1jb250cm9sLmpzIiwianMvZmlsdGVycy9hbGwtZmlsdGVyLmpzIiwianMvZmlsdGVycy9vdmVydGltZS1maWx0ZXIuanMiLCJqcy9sYXllcnMvY2x1c3RlcnMtbGF5ZXIuanMiLCJqcy9sYXllcnMvY291bnRpZXMtbGF5ZXIuanMiLCJqcy9sYXllcnMvbWFya2Vycy1sYXllci5qcyIsImpzL2xheWVycy90aWxlcy1sYXllci5qcyIsImpzL21haW4uanMiLCJqcy9zZXJ2aWNlcy9jb3VudGllcy1zZXJ2aWNlLmpzIiwianMvc2VydmljZXMvcHJvamVjdHMtc2VydmljZS5qcyIsImpzL3V0aWwvY2hvcm9wbGV0aC11dGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgaXNDbHVzdGVyaW5nRW5hYmxlZCA9IGZhbHNlO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEwuZWFzeUJ1dHRvbignZmEtbWFwLW1hcmtlcicsIGZ1bmN0aW9uKGJ0biwgbWFwKSB7XG5cbiAgaWYgKGlzQ2x1c3RlcmluZ0VuYWJsZWQpIHtcbiAgICB3aW5kb3cubWFwLmZpcmVFdmVudCgnaGlkZUxheWVyJywge2xheWVyOiAnY2x1c3RlcnMnfSk7XG4gICAgd2luZG93Lm1hcC5maXJlRXZlbnQoJ3Nob3dMYXllcicsIHtsYXllcjogJ21hcmtlcnMnfSk7XG4gICAgd2luZG93Lm1hcC5maXJlRXZlbnQoJ3Nob3dDb250cm9sJywge2NvbnRyb2w6ICdmaWx0ZXInfSk7XG4gIH0gZWxzZSB7XG4gICAgd2luZG93Lm1hcC5maXJlRXZlbnQoJ2hpZGVMYXllcicsIHtsYXllcjogJ21hcmtlcnMnfSk7XG4gICAgd2luZG93Lm1hcC5maXJlRXZlbnQoJ3Nob3dMYXllcicsIHtsYXllcjogJ2NsdXN0ZXJzJ30pO1xuICAgIHdpbmRvdy5tYXAuZmlyZUV2ZW50KCdoaWRlQ29udHJvbCcsIHtjb250cm9sOiAnZmlsdGVyJ30pO1xuICB9XG5cbiAgaXNDbHVzdGVyaW5nRW5hYmxlZCA9ICFpc0NsdXN0ZXJpbmdFbmFibGVkO1xuXG59KTtcblxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZmlsdGVyR3JvdXBzKSB7XG5cbiAgdmFyIGdyb3VwZWRPdmVybGF5cyA9IHtcbiAgICBcIkZpbHRlclwiOiB7XG4gICAgICBcIk9uIFRpbWUgUHJvamVjdHNcIjogZmlsdGVyR3JvdXBzLmFsbCxcbiAgICAgIFwiT3ZlcmR1ZSBQcm9qZWN0c1wiOiBmaWx0ZXJHcm91cHMub3ZlcnRpbWVcbiAgICB9XG4gIH07XG5cbiAgdmFyIG9wdGlvbnMgPSB7XG4gICAgcG9zaXRpb246ICdib3R0b21sZWZ0JyxcbiAgICBleGNsdXNpdmVHcm91cHM6IFsnRmlsdGVyJ11cbiAgfTtcblxuICByZXR1cm4gTC5jb250cm9sLmdyb3VwZWRMYXllcnMoe30sIGdyb3VwZWRPdmVybGF5cywgb3B0aW9ucyk7XG59O1xuXG4iLCJ2YXIgaW5mb0NvbnRyb2wgPSBMLmNvbnRyb2woe3Bvc2l0aW9uOiAndG9wcmlnaHQnfSk7XG5cbmluZm9Db250cm9sLnVwZGF0ZSA9IGZ1bmN0aW9uIChlKSB7XG4gIHZhciBwcm9qZWN0ID0gZSA/IGUucHJvamVjdCA6IHVuZGVmaW5lZDtcbiAgXG4gIHRoaXMuX2Rpdi5pbm5lckhUTUwgPSAgKHByb2plY3QgP1xuICAgICc8aDQ+JyArIChwcm9qZWN0LnRpdGxlID8gcHJvamVjdC50aXRsZSA6ICdQcm9qZWN0IGluICcgKyBwcm9qZWN0LmNvbnN0aXR1ZW5jeSkgKyAnPC9oND4nICtcbiAgICAgIChwcm9qZWN0LmRlc2NyaXB0aW9uID8gJzxwPicgKyBwcm9qZWN0LmRlc2NyaXB0aW9uICsgJzwvcD4nIDogJzxwPk5vIERlc2NyaXB0aW9uPC9wPicpICtcbiAgICAgIChwcm9qZWN0Lm9iamVjdGl2ZXMgPyAnPGg1Pk9iamVjdGl2ZXM8L2g1PjxwPicgKyBwcm9qZWN0Lm9iamVjdGl2ZXMgKyAnPC9wPicgOiAnJykgXG4gIDogJzxoND5Eb25vciBhbmQgR292ZXJubWVudCBGdW5kZWQgUHJvamVjdHMgaW4gS2VueWE8L2g0PicpO1xufTtcblxuaW5mb0NvbnRyb2wub25BZGQgPSBmdW5jdGlvbiAobWFwKSB7XG4gIHRoaXMuX2RpdiA9IEwuRG9tVXRpbC5jcmVhdGUoJ2RpdicsICdpbmZvIHByb2plY3QtaW5mbycpO1xuXG4gIHdpbmRvdy5tYXAub24oJ3Nob3dQcm9qZWN0RGV0YWlscycsIGluZm9Db250cm9sLnVwZGF0ZS5iaW5kKHRoaXMpKTtcblxuICBpbmZvQ29udHJvbC51cGRhdGUoKTtcblxuICByZXR1cm4gdGhpcy5fZGl2O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBpbmZvQ29udHJvbDtcbiIsInZhciBwcm9qZWN0Q291bnRUb0NvbG91ciA9IHJlcXVpcmUoJy4uL3V0aWwvY2hvcm9wbGV0aC11dGlscycpLnByb2plY3RDb3VudFRvQ29sb3VyO1xuXG52YXIgbGVnZW5kQ29udHJvbCA9IEwuY29udHJvbCh7cG9zaXRpb246ICdib3R0b21yaWdodCd9KTtcblxubGVnZW5kQ29udHJvbC5vbkFkZCA9IGZ1bmN0aW9uIChtYXApIHtcblxuICB2YXIgZGl2ID0gTC5Eb21VdGlsLmNyZWF0ZSgnZGl2JywgJ2luZm8gbGVnZW5kJyksXG4gIGdyYWRlcyA9IFswLCAxMCwgMjAsIDMwLCA0MCwgNTBdLFxuICBsYWJlbHMgPSBbXSxcbiAgZnJvbSwgdG87XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBncmFkZXMubGVuZ3RoOyBpKyspIHtcbiAgICBmcm9tID0gZ3JhZGVzW2ldO1xuICAgIHRvID0gZ3JhZGVzW2kgKyAxXTtcblxuICAgIGxhYmVscy5wdXNoKFxuICAgICAgJzxpIHN0eWxlPVwiYmFja2dyb3VuZDonICsgcHJvamVjdENvdW50VG9Db2xvdXIoZnJvbSArIDEpICsgJ1wiPjwvaT4gJyArXG4gICAgICAgIGZyb20gKyAodG8gPyAnJm5kYXNoOycgKyB0byA6ICcrJykpO1xuICB9XG5cbiAgZGl2LmlubmVySFRNTCA9ICc8aDQ+TGVnZW5kPC9oND48aDU+UHJvamVjdHMgcGVyIENvdW50eTwvaDU+JyArIGxhYmVscy5qb2luKCc8YnI+Jyk7XG4gIHJldHVybiBkaXY7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGxlZ2VuZENvbnRyb2w7XG5cbiIsInZhciBncm91cCA9IEwubGF5ZXJHcm91cCgpO1xuXG52YXIgb25EYXRhUmVjZWl2ZWQgPSBmdW5jdGlvbiAoZSkge1xuICBpZiAoZS5kYXRhVHlwZSA9PT0gJ3Byb2plY3RzJyAmJiBlLmRhdGEgJiYgZS5kYXRhLmxlbmd0aCkge1xuICAgIHZhciBwcm9qZWN0cyA9IGUuZGF0YTtcblxuICAgIGZvciAodmFyIGk9MDsgaTxwcm9qZWN0cy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHByb2plY3RzW2ldLm1hcmtlcikge1xuICAgICAgICBwcm9qZWN0c1tpXS5tYXJrZXIuYWRkVG8oZ3JvdXApO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoKSB7XG4gIHdpbmRvdy5tYXAub24oJ2RhdGFSZWNlaXZlZCcsIG9uRGF0YVJlY2VpdmVkKTtcbiAgcmV0dXJuIGdyb3VwO1xufTtcblxuIiwidmFyIGdyb3VwID0gTC5sYXllckdyb3VwKCk7XG5cbnZhciBvbkRhdGFSZWNlaXZlZCA9IGZ1bmN0aW9uIChlKSB7XG4gIGlmIChlLmRhdGFUeXBlID09PSAncHJvamVjdHMnICYmIGUuZGF0YSAmJiBlLmRhdGEubGVuZ3RoKSB7XG4gICAgdmFyIHByb2plY3RzID0gZS5kYXRhO1xuXG4gICAgZm9yICh2YXIgaT0wOyBpPHByb2plY3RzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAocHJvamVjdHNbaV0ubWFya2VyKSB7XG4gICAgICAgIGlmIChwcm9qZWN0c1tpXS5lbmREYXRlUGxhbm5lZCAmJlxuICAgICAgICAgICFwcm9qZWN0c1tpXS5lbmREYXRlQWN0dWFsICYmXG4gICAgICAgICAgbW9tZW50KHByb2plY3RzW2ldLmVuZERhdGVQbGFubmVkKS5pc0JlZm9yZShtb21lbnQoKSkpIHtcbiAgICAgICAgICBwcm9qZWN0c1tpXS5tYXJrZXIuYWRkVG8oZ3JvdXApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHtcbiAgd2luZG93Lm1hcC5vbignZGF0YVJlY2VpdmVkJywgb25EYXRhUmVjZWl2ZWQpO1xuICByZXR1cm4gZ3JvdXA7XG59O1xuXG4iLCJ2YXIgY2x1c3RlcnNMYXllcjtcblxudmFyIG9uRGF0YVJlY2VpdmVkID0gZnVuY3Rpb24gKGUpIHtcbiAgaWYgKGUuZGF0YVR5cGUgPT09ICdwcm9qZWN0cycgJiYgZS5kYXRhICYmIGUuZGF0YS5sZW5ndGgpIHtcbiAgICB2YXIgcHJvamVjdHMgPSBlLmRhdGE7XG5cbiAgICBmb3IgKHZhciBpPTA7IGk8cHJvamVjdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChwcm9qZWN0c1tpXS5tYXJrZXIpIHtcbiAgICAgICAgY2x1c3RlcnNMYXllci5hZGRMYXllcihwcm9qZWN0c1tpXS5tYXJrZXIpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoKSB7XG5cbiAgY2x1c3RlcnNMYXllciA9IEwubWFya2VyQ2x1c3Rlckdyb3VwKHtzaG93Q292ZXJhZ2VPbkhvdmVyOiBmYWxzZSwgem9vbVRvQm91bmRzT25DbGljazogdHJ1ZX0pO1xuXG4gIHdpbmRvdy5tYXAub24oJ2RhdGFSZWNlaXZlZCcsIG9uRGF0YVJlY2VpdmVkKTtcblxuICByZXR1cm4gY2x1c3RlcnNMYXllcjtcbn07XG5cbiIsInZhciBjaG9yb3BsZXRoVXRpbHMgPSByZXF1aXJlKCcuLi91dGlsL2Nob3JvcGxldGgtdXRpbHMnKTtcblxudmFyIGNvdW50aWVzTGF5ZXIsIGNvdW50aWVzRGF0YSwgcHJvamVjdHM7XG5cbmZ1bmN0aW9uIGdldFByb2plY3RDb3VudEZvckNvdW50eShuYW1lKSB7XG4gIHZhciBjb3VudCA9IDA7XG5cbiAgZm9yICh2YXIgaT0wOyBpPHByb2plY3RzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHByb2plY3RzW2ldLm1hcmtlciAmJiBwcm9qZWN0c1tpXS5jb3VudHkgPT09IG5hbWUpIHtcbiAgICAgIGNvdW50Kys7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGNvdW50O1xufVxuXG5mdW5jdGlvbiBzdHlsZShmZWF0dXJlKSB7XG4gIHJldHVybiB7XG4gICAgZmlsbENvbG9yOiBjaG9yb3BsZXRoVXRpbHMucHJvamVjdENvdW50VG9Db2xvdXIoZ2V0UHJvamVjdENvdW50Rm9yQ291bnR5KGZlYXR1cmUucHJvcGVydGllcy5DT1VOVFlfTkFNKSksXG4gICAgd2VpZ2h0OiAyLFxuICAgIG9wYWNpdHk6IDEsXG4gICAgY29sb3I6ICd3aGl0ZScsXG4gICAgZGFzaEFycmF5OiAnMycsXG4gICAgZmlsbE9wYWNpdHk6IDAuN1xuICB9O1xufVxuXG5mdW5jdGlvbiB6b29tVG9GZWF0dXJlKGUpIHtcbiAgbWFwLmZpdEJvdW5kcyhlLnRhcmdldC5nZXRCb3VuZHMoKSk7XG59XG5cbmZ1bmN0aW9uIG9uRWFjaEZlYXR1cmUoZmVhdHVyZSwgbGF5ZXIpIHtcbiAgbGF5ZXIub24oe1xuICAgIGNsaWNrOiB6b29tVG9GZWF0dXJlXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBkcmF3R2VvSlNPTigpIHtcbiAgY291bnRpZXNMYXllci5jbGVhckxheWVycygpO1xuXG4gIHZhciBsID0gTC5nZW9Kc29uKGNvdW50aWVzRGF0YSwge1xuICAgIHN0eWxlOiBzdHlsZSxcbiAgICBvbkVhY2hGZWF0dXJlOiBvbkVhY2hGZWF0dXJlXG4gIH0pO1xuXG4gIGwuYWRkVG8oY291bnRpZXNMYXllcik7XG59XG5cbmZ1bmN0aW9uIG9uRGF0YVJlY2VpdmVkIChlKSB7XG4gIGlmIChlLmRhdGFUeXBlID09PSAnY291bnRpZXMnICYmIGUuZGF0YSkge1xuICAgIGNvdW50aWVzRGF0YSA9IGUuZGF0YTtcbiAgfSBlbHNlIGlmIChlLmRhdGFUeXBlID09PSAncHJvamVjdHMnICYmIGUuZGF0YSAmJiBlLmRhdGEubGVuZ3RoKSB7XG4gICAgcHJvamVjdHMgPSBlLmRhdGE7XG4gIH1cblxuICBpZiAoY291bnRpZXNEYXRhICYmIHByb2plY3RzKSB7XG4gICAgZHJhd0dlb0pTT04oKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHtcbiAgY291bnRpZXNMYXllciA9IEwubGF5ZXJHcm91cCgpO1xuXG4gIHdpbmRvdy5tYXAub24oJ2RhdGFSZWNlaXZlZCcsIG9uRGF0YVJlY2VpdmVkKTtcblxuICByZXR1cm4gY291bnRpZXNMYXllcjtcbn07XG5cbiIsInZhciBtYXJrZXJzTGF5ZXI7XG5cbnZhciBta0hvdmVyRnVuY3Rpb24gPSBmdW5jdGlvbiAocHJvamVjdCkge1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHdpbmRvdy5tYXAuZmlyZUV2ZW50KCdzaG93UHJvamVjdERldGFpbHMnLCB7cHJvamVjdDogcHJvamVjdH0pO1xuICB9O1xufTtcblxudmFyIG9uRGF0YVJlY2VpdmVkID0gZnVuY3Rpb24gKGUpIHtcblxuICBpZiAoZS5kYXRhVHlwZSA9PT0gJ3Byb2plY3RzJyAmJiBlLmRhdGEgJiYgZS5kYXRhLmxlbmd0aCkge1xuXG4gICAgdmFyIHByb2plY3RzID0gZS5kYXRhO1xuXG4gICAgZm9yICh2YXIgaT0wOyBpPHByb2plY3RzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAocHJvamVjdHNbaV0ubG5nICYmIHByb2plY3RzW2ldLmxhdCkge1xuICAgICAgICBwcm9qZWN0c1tpXS5tYXJrZXIgPSBMLm1hcmtlcihbcHJvamVjdHNbaV0ubGF0LCBwcm9qZWN0c1tpXS5sbmddKTtcblxuICAgICAgICBwcm9qZWN0c1tpXS5tYXJrZXIub24oJ21vdXNlb3ZlcicsIG1rSG92ZXJGdW5jdGlvbihwcm9qZWN0c1tpXSkpO1xuICAgICAgICBwcm9qZWN0c1tpXS5tYXJrZXIub24oJ21vdXNlb3V0JywgbWtIb3ZlckZ1bmN0aW9uKG51bGwpKTtcblxuICAgICAgICBtYXJrZXJzTGF5ZXIuYWRkTGF5ZXIocHJvamVjdHNbaV0ubWFya2VyKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoKSB7XG4gIG1hcmtlcnNMYXllciA9IEwubGF5ZXJHcm91cCgpO1xuXG4gIHdpbmRvdy5tYXAub24oJ2RhdGFSZWNlaXZlZCcsIG9uRGF0YVJlY2VpdmVkKTtcblxuICByZXR1cm4gbWFya2Vyc0xheWVyO1xufTtcblxuIiwibW9kdWxlLmV4cG9ydHMgPSBMLnRpbGVMYXllcignaHR0cDovL3tzfS5iYXNlbWFwcy5jYXJ0b2Nkbi5jb20vbGlnaHRfYWxsL3t6fS97eH0ve3l9LnBuZycsIHtcbiAgYXR0cmlidXRpb246ICcmY29weTsgPGEgaHJlZj1cImh0dHA6Ly93d3cub3BlbnN0cmVldG1hcC5vcmcvY29weXJpZ2h0XCI+T3BlblN0cmVldE1hcDwvYT4gY29udHJpYnV0b3JzLCAmY29weTsgPGEgaHJlZj1cImh0dHA6Ly9jYXJ0b2RiLmNvbS9hdHRyaWJ1dGlvbnNcIj5DYXJ0b0RCPC9hPidcbn0pO1xuIiwidmFyIE1BUF9DRU5URVIgPSBbMC41LCAzOV07XG52YXIgTUFQX1pPT00gPSA2O1xuXG4kKGZ1bmN0aW9uICgpIHtcblxuICB2YXIgbGF5ZXJzID0ge30sIGNvbnRyb2xzID0ge307XG5cbiAgd2luZG93Lm1hcCA9IEwubWFwKCdtYXAnLCB7XG4gICAgc2Nyb2xsV2hlZWxab29tOiBmYWxzZSxcbiAgICBjZW50ZXI6IE1BUF9DRU5URVIsXG4gICAgem9vbTogTUFQX1pPT01cbiAgfSk7XG5cbiAgbGF5ZXJzLnRpbGVzID0gcmVxdWlyZSgnLi9sYXllcnMvdGlsZXMtbGF5ZXInKTtcbiAgbGF5ZXJzLm1hcmtlcnMgPSByZXF1aXJlKCcuL2xheWVycy9tYXJrZXJzLWxheWVyJykoKTtcbiAgbGF5ZXJzLmNsdXN0ZXJzID0gcmVxdWlyZSgnLi9sYXllcnMvY2x1c3RlcnMtbGF5ZXInKSgpO1xuICBsYXllcnMuY291bnRpZXMgPSByZXF1aXJlKCcuL2xheWVycy9jb3VudGllcy1sYXllcicpKCk7XG5cbiAgbGF5ZXJzLnRpbGVzLmFkZFRvKG1hcCk7XG4gIGxheWVycy5tYXJrZXJzLmFkZFRvKG1hcCk7XG4gIGxheWVycy5jb3VudGllcy5hZGRUbyhtYXApO1xuXG4gIHZhciBmaWx0ZXJHcm91cHMgPSB7XG4gICAgYWxsOiByZXF1aXJlKCcuL2ZpbHRlcnMvYWxsLWZpbHRlcicpKCksXG4gICAgb3ZlcnRpbWU6IHJlcXVpcmUoJy4vZmlsdGVycy9vdmVydGltZS1maWx0ZXInKSgpXG4gIH07XG5cbiAgY29udHJvbHMuaW5mbyA9IHJlcXVpcmUoJy4vY29udHJvbHMvaW5mby1jb250cm9sJyk7XG4gIGNvbnRyb2xzLmxlZ2VuZCA9IHJlcXVpcmUoJy4vY29udHJvbHMvbGVnZW5kLWNvbnRyb2wnKTtcbiAgY29udHJvbHMuY2x1c3RlciA9IHJlcXVpcmUoJy4vY29udHJvbHMvY2x1c3Rlci1jb250cm9sJyk7XG4gIGNvbnRyb2xzLmZpbHRlciA9IHJlcXVpcmUoJy4vY29udHJvbHMvZmlsdGVyZWQtbGF5ZXItY29udHJvbCcpKGZpbHRlckdyb3Vwcyk7XG4gIFxuICBjb250cm9scy5pbmZvLmFkZFRvKG1hcCk7XG4gIGNvbnRyb2xzLmxlZ2VuZC5hZGRUbyhtYXApO1xuICBjb250cm9scy5jbHVzdGVyLmFkZFRvKG1hcCk7XG4gIGNvbnRyb2xzLmZpbHRlci5hZGRUbyhtYXApO1xuXG4gIG1hcC5vbignaGlkZUxheWVyJywgZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAobGF5ZXJzW2UubGF5ZXJdKSB7XG4gICAgICBtYXAucmVtb3ZlTGF5ZXIobGF5ZXJzW2UubGF5ZXJdKTtcbiAgICB9XG4gIH0pO1xuXG4gIG1hcC5vbignc2hvd0xheWVyJywgZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAobGF5ZXJzW2UubGF5ZXJdKSB7XG4gICAgICBtYXAuYWRkTGF5ZXIobGF5ZXJzW2UubGF5ZXJdKTtcbiAgICB9XG4gIH0pO1xuXG4gIG1hcC5vbignaGlkZUNvbnRyb2wnLCBmdW5jdGlvbiAoZSkge1xuICAgIGlmIChjb250cm9sc1tlLmNvbnRyb2xdKSB7XG4gICAgICBtYXAucmVtb3ZlQ29udHJvbChjb250cm9sc1tlLmNvbnRyb2xdKTtcbiAgICB9XG4gIH0pO1xuXG4gIG1hcC5vbignc2hvd0NvbnRyb2wnLCBmdW5jdGlvbiAoZSkge1xuICAgIGlmIChjb250cm9sc1tlLmNvbnRyb2xdKSB7XG4gICAgICBtYXAuYWRkQ29udHJvbChjb250cm9sc1tlLmNvbnRyb2xdKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJlcXVpcmUoJy4vc2VydmljZXMvcHJvamVjdHMtc2VydmljZScpLmZldGNoQWxsKCk7XG4gIHJlcXVpcmUoJy4vc2VydmljZXMvY291bnRpZXMtc2VydmljZScpLmZldGNoQWxsKCk7XG5cbn0pO1xuIiwid2luZG93LmRhdGEgPSB3aW5kb3cuZGF0YSB8fCB7fTtcblxubW9kdWxlLmV4cG9ydHMuZmV0Y2hBbGwgPSBmdW5jdGlvbiAoKSB7XG5cbiAgJC5nZXQoJy9kYXRhL2NvdW50aWVzLmpzb24nKS50aGVuKGZ1bmN0aW9uIChkYXRhKSB7XG5cbiAgICB3aW5kb3cubWFwLmZpcmVFdmVudCgnZGF0YVJlY2VpdmVkJywge2RhdGFUeXBlOiAnY291bnRpZXMnLCBkYXRhOiBkYXRhfSk7XG5cbiAgfSwgZnVuY3Rpb24gKGVycikge1xuXG4gICAgYWxlcnQoJ0NvdWxkIG5vdCBmZXRjaCBjb3VudGllcyBKU09OLicpO1xuXG4gIH0pO1xuXG59O1xuIiwid2luZG93LmRhdGEgPSB3aW5kb3cuZGF0YSB8fCB7fTtcblxubW9kdWxlLmV4cG9ydHMuZmV0Y2hBbGwgPSBmdW5jdGlvbiAoKSB7XG5cbiAgJC5nZXQoJy9kYXRhL3Byb2plY3RzLmpzb24nKS50aGVuKGZ1bmN0aW9uIChkYXRhKSB7XG5cbiAgICB3aW5kb3cubWFwLmZpcmVFdmVudCgnZGF0YVJlY2VpdmVkJywge2RhdGFUeXBlOiAncHJvamVjdHMnLCBkYXRhOiBkYXRhLnByb2plY3RzfSk7XG5cbiAgfSwgZnVuY3Rpb24gKGVycikge1xuXG4gICAgYWxlcnQoJ0NvdWxkIG5vdCBmZXRjaCBwcm9qZWN0cyBKU09OLicpO1xuXG4gIH0pO1xuXG59O1xuIiwibW9kdWxlLmV4cG9ydHMucHJvamVjdENvdW50VG9Db2xvdXIgPSBmdW5jdGlvbiAoZCkge1xuICByZXR1cm4gZCA+IDUwID8gJyM4MTBmN2MnIDpcbiAgZCA+IDQwICA/ICcjODg1NmE3JyA6XG4gIGQgPiAzMCAgID8gJyM4Yzk2YzYnIDpcbiAgZCA+IDIwICAgPyAnIzllYmNkYScgOlxuICBkID4gMTAgICA/ICcjYmZkM2U2JyA6XG4gICcjZWRmOGZiJztcbn07XG5cbiJdfQ==
