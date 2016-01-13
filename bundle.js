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
module.exports = function (countyGroups) {

  var groupedOverlays = {
    "Counties": {
      "Projects per County": countyGroups[0],
      "Average Cost per County": countyGroups[1]
    }
  };

  var options = {
    position: 'bottomleft',
    exclusiveGroups: ['Counties']
  };

  return L.control.groupedLayers({}, groupedOverlays, options);
};


},{}],3:[function(require,module,exports){
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


},{}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
var projectCountToColour = require('../util/choropleth-utils').projectCountToColour;
var avgCostToColour = require('../util/choropleth-utils').avgCostToColour;

var legendControl = L.control({position: 'bottomright'});

var renderProjectsLegend = function () {
  var grades = [0, 10, 20, 30, 40, 50],
  labels = [],
  from, to;

  for (var i = 0; i < grades.length; i++) {
    from = grades[i];
    to = grades[i + 1];

    labels.push(
      '<i style="background:' + projectCountToColour(from + 1) + '"></i> ' +
        from + (to ? '&ndash;' + to : '+'));
  }

  return '<h5>Projects per County</h5>' + labels.join('<br>');
};

var renderAvgCostLegend = function () {
  var grades = [0, 500000000, 1000000000, 1500000000, 2000000000, 2500000000],
  labels = [],
  from, to;

  for (var i = 0; i < grades.length; i++) {
    from = grades[i];
    to = grades[i + 1];

    labels.push(
      '<i style="background:' + avgCostToColour(from + 1) + '"></i> ' +
        from + (to ? '&ndash;' + to : '+'));
  }

  return '<h5>Avg. Cost per County (KES)</h5>' + labels.join('<br>');
};

legendControl.onAdd = function () {

  var div = L.DomUtil.create('div', 'info legend');

  div.innerHTML = '<h4>Legend</h4>' +
    renderProjectsLegend() +
    renderAvgCostLegend();

  return div;
};

module.exports = legendControl;


},{"../util/choropleth-utils":16}],6:[function(require,module,exports){
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


},{}],7:[function(require,module,exports){
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


},{}],8:[function(require,module,exports){
var choroplethUtils = require('../util/choropleth-utils');

var countiesLayer, countiesData, projects;

function getAvgCostForCounty(name) {
  var cost = 0, count = 0;

  for (var i=0; i<projects.length; i++) {
    if (projects[i].marker && projects[i].county === name && projects[i].totalProjectCost && !isNaN(parseFloat(projects[i].totalProjectCost))) {
      cost += parseFloat(projects[i].totalProjectCost);
      count++;
    }
  }

  return cost / count;
}

function style(feature) {
  return {
    fillColor: choroplethUtils.avgCostToColour(getAvgCostForCounty(feature.properties.COUNTY_NAM)),
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


},{"../util/choropleth-utils":16}],9:[function(require,module,exports){
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


},{}],10:[function(require,module,exports){
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


},{"../util/choropleth-utils":16}],11:[function(require,module,exports){
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


},{}],12:[function(require,module,exports){
module.exports = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
});

},{}],13:[function(require,module,exports){
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

},{"./controls/cluster-control":1,"./controls/county-layer-control":2,"./controls/filtered-layer-control":3,"./controls/info-control":4,"./controls/legend-control":5,"./filters/all-filter":6,"./filters/overtime-filter":7,"./layers/avgcost-layer":8,"./layers/clusters-layer":9,"./layers/counties-layer":10,"./layers/markers-layer":11,"./layers/tiles-layer":12,"./services/counties-service":14,"./services/projects-service":15}],14:[function(require,module,exports){
window.data = window.data || {};

module.exports.fetchAll = function () {

  $.get('/data/counties.json').then(function (data) {

    window.map.fireEvent('dataReceived', {dataType: 'counties', data: data});

  }, function (err) {

    alert('Could not fetch counties JSON.');

  });

};

},{}],15:[function(require,module,exports){
window.data = window.data || {};

module.exports.fetchAll = function () {

  $.get('/data/projects.json').then(function (data) {

    window.map.fireEvent('dataReceived', {dataType: 'projects', data: data.projects});

  }, function (err) {

    alert('Could not fetch projects JSON.');

  });

};

},{}],16:[function(require,module,exports){
module.exports.projectCountToColour = function (d) {
  return d > 50 ? '#810f7c' :
  d > 40  ? '#8856a7' :
  d > 30   ? '#8c96c6' :
  d > 20   ? '#9ebcda' :
  d > 10   ? '#bfd3e6' :
  '#edf8fb';
};

module.exports.avgCostToColour = function (d) {
  return d > 2500000000 ? '#b30000' :
  d > 2000000000  ? '#e34a33' :
  d > 1500000000   ? '#fc8d59' :
  d > 1000000000   ? '#fdbb84' :
  d > 500000000   ? '#fdd49e' :
  '#fef0d9';
};


},{}]},{},[13])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy5udm0vdmVyc2lvbnMvbm9kZS92NS4xLjAvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwianMvY29udHJvbHMvY2x1c3Rlci1jb250cm9sLmpzIiwianMvY29udHJvbHMvY291bnR5LWxheWVyLWNvbnRyb2wuanMiLCJqcy9jb250cm9scy9maWx0ZXJlZC1sYXllci1jb250cm9sLmpzIiwianMvY29udHJvbHMvaW5mby1jb250cm9sLmpzIiwianMvY29udHJvbHMvbGVnZW5kLWNvbnRyb2wuanMiLCJqcy9maWx0ZXJzL2FsbC1maWx0ZXIuanMiLCJqcy9maWx0ZXJzL292ZXJ0aW1lLWZpbHRlci5qcyIsImpzL2xheWVycy9hdmdjb3N0LWxheWVyLmpzIiwianMvbGF5ZXJzL2NsdXN0ZXJzLWxheWVyLmpzIiwianMvbGF5ZXJzL2NvdW50aWVzLWxheWVyLmpzIiwianMvbGF5ZXJzL21hcmtlcnMtbGF5ZXIuanMiLCJqcy9sYXllcnMvdGlsZXMtbGF5ZXIuanMiLCJqcy9tYWluLmpzIiwianMvc2VydmljZXMvY291bnRpZXMtc2VydmljZS5qcyIsImpzL3NlcnZpY2VzL3Byb2plY3RzLXNlcnZpY2UuanMiLCJqcy91dGlsL2Nob3JvcGxldGgtdXRpbHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGlzQ2x1c3RlcmluZ0VuYWJsZWQgPSBmYWxzZTtcblxubW9kdWxlLmV4cG9ydHMgPSBMLmVhc3lCdXR0b24oJ2ZhLW1hcC1tYXJrZXInLCBmdW5jdGlvbihidG4sIG1hcCkge1xuXG4gIGlmIChpc0NsdXN0ZXJpbmdFbmFibGVkKSB7XG4gICAgd2luZG93Lm1hcC5maXJlRXZlbnQoJ2hpZGVMYXllcicsIHtsYXllcjogJ2NsdXN0ZXJzJ30pO1xuICAgIHdpbmRvdy5tYXAuZmlyZUV2ZW50KCdzaG93TGF5ZXInLCB7bGF5ZXI6ICdtYXJrZXJzJ30pO1xuICAgIHdpbmRvdy5tYXAuZmlyZUV2ZW50KCdzaG93Q29udHJvbCcsIHtjb250cm9sOiAnZmlsdGVyJ30pO1xuICB9IGVsc2Uge1xuICAgIHdpbmRvdy5tYXAuZmlyZUV2ZW50KCdoaWRlTGF5ZXInLCB7bGF5ZXI6ICdtYXJrZXJzJ30pO1xuICAgIHdpbmRvdy5tYXAuZmlyZUV2ZW50KCdzaG93TGF5ZXInLCB7bGF5ZXI6ICdjbHVzdGVycyd9KTtcbiAgICB3aW5kb3cubWFwLmZpcmVFdmVudCgnaGlkZUNvbnRyb2wnLCB7Y29udHJvbDogJ2ZpbHRlcid9KTtcbiAgfVxuXG4gIGlzQ2x1c3RlcmluZ0VuYWJsZWQgPSAhaXNDbHVzdGVyaW5nRW5hYmxlZDtcblxufSk7XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvdW50eUdyb3Vwcykge1xuXG4gIHZhciBncm91cGVkT3ZlcmxheXMgPSB7XG4gICAgXCJDb3VudGllc1wiOiB7XG4gICAgICBcIlByb2plY3RzIHBlciBDb3VudHlcIjogY291bnR5R3JvdXBzWzBdLFxuICAgICAgXCJBdmVyYWdlIENvc3QgcGVyIENvdW50eVwiOiBjb3VudHlHcm91cHNbMV1cbiAgICB9XG4gIH07XG5cbiAgdmFyIG9wdGlvbnMgPSB7XG4gICAgcG9zaXRpb246ICdib3R0b21sZWZ0JyxcbiAgICBleGNsdXNpdmVHcm91cHM6IFsnQ291bnRpZXMnXVxuICB9O1xuXG4gIHJldHVybiBMLmNvbnRyb2wuZ3JvdXBlZExheWVycyh7fSwgZ3JvdXBlZE92ZXJsYXlzLCBvcHRpb25zKTtcbn07XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGZpbHRlckdyb3Vwcykge1xuXG4gIHZhciBncm91cGVkT3ZlcmxheXMgPSB7XG4gICAgXCJGaWx0ZXJcIjoge1xuICAgICAgXCJPbiBUaW1lIFByb2plY3RzXCI6IGZpbHRlckdyb3Vwcy5hbGwsXG4gICAgICBcIk92ZXJkdWUgUHJvamVjdHNcIjogZmlsdGVyR3JvdXBzLm92ZXJ0aW1lXG4gICAgfVxuICB9O1xuXG4gIHZhciBvcHRpb25zID0ge1xuICAgIHBvc2l0aW9uOiAnYm90dG9tbGVmdCcsXG4gICAgZXhjbHVzaXZlR3JvdXBzOiBbJ0ZpbHRlciddXG4gIH07XG5cbiAgcmV0dXJuIEwuY29udHJvbC5ncm91cGVkTGF5ZXJzKHt9LCBncm91cGVkT3ZlcmxheXMsIG9wdGlvbnMpO1xufTtcblxuIiwidmFyIGluZm9Db250cm9sID0gTC5jb250cm9sKHtwb3NpdGlvbjogJ3RvcHJpZ2h0J30pO1xuXG5pbmZvQ29udHJvbC51cGRhdGUgPSBmdW5jdGlvbiAoZSkge1xuICB2YXIgcHJvamVjdCA9IGUgPyBlLnByb2plY3QgOiB1bmRlZmluZWQ7XG4gIFxuICB0aGlzLl9kaXYuaW5uZXJIVE1MID0gIChwcm9qZWN0ID9cbiAgICAnPGg0PicgKyAocHJvamVjdC50aXRsZSA/IHByb2plY3QudGl0bGUgOiAnUHJvamVjdCBpbiAnICsgcHJvamVjdC5jb25zdGl0dWVuY3kpICsgJzwvaDQ+JyArXG4gICAgICAocHJvamVjdC5kZXNjcmlwdGlvbiA/ICc8cD4nICsgcHJvamVjdC5kZXNjcmlwdGlvbiArICc8L3A+JyA6ICc8cD5ObyBEZXNjcmlwdGlvbjwvcD4nKSArXG4gICAgICAocHJvamVjdC5vYmplY3RpdmVzID8gJzxoNT5PYmplY3RpdmVzPC9oNT48cD4nICsgcHJvamVjdC5vYmplY3RpdmVzICsgJzwvcD4nIDogJycpIFxuICA6ICc8aDQ+RG9ub3IgYW5kIEdvdmVybm1lbnQgRnVuZGVkIFByb2plY3RzIGluIEtlbnlhPC9oND4nKTtcbn07XG5cbmluZm9Db250cm9sLm9uQWRkID0gZnVuY3Rpb24gKG1hcCkge1xuICB0aGlzLl9kaXYgPSBMLkRvbVV0aWwuY3JlYXRlKCdkaXYnLCAnaW5mbyBwcm9qZWN0LWluZm8nKTtcblxuICB3aW5kb3cubWFwLm9uKCdzaG93UHJvamVjdERldGFpbHMnLCBpbmZvQ29udHJvbC51cGRhdGUuYmluZCh0aGlzKSk7XG5cbiAgaW5mb0NvbnRyb2wudXBkYXRlKCk7XG5cbiAgcmV0dXJuIHRoaXMuX2Rpdjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gaW5mb0NvbnRyb2w7XG4iLCJ2YXIgcHJvamVjdENvdW50VG9Db2xvdXIgPSByZXF1aXJlKCcuLi91dGlsL2Nob3JvcGxldGgtdXRpbHMnKS5wcm9qZWN0Q291bnRUb0NvbG91cjtcbnZhciBhdmdDb3N0VG9Db2xvdXIgPSByZXF1aXJlKCcuLi91dGlsL2Nob3JvcGxldGgtdXRpbHMnKS5hdmdDb3N0VG9Db2xvdXI7XG5cbnZhciBsZWdlbmRDb250cm9sID0gTC5jb250cm9sKHtwb3NpdGlvbjogJ2JvdHRvbXJpZ2h0J30pO1xuXG52YXIgcmVuZGVyUHJvamVjdHNMZWdlbmQgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBncmFkZXMgPSBbMCwgMTAsIDIwLCAzMCwgNDAsIDUwXSxcbiAgbGFiZWxzID0gW10sXG4gIGZyb20sIHRvO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZ3JhZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgZnJvbSA9IGdyYWRlc1tpXTtcbiAgICB0byA9IGdyYWRlc1tpICsgMV07XG5cbiAgICBsYWJlbHMucHVzaChcbiAgICAgICc8aSBzdHlsZT1cImJhY2tncm91bmQ6JyArIHByb2plY3RDb3VudFRvQ29sb3VyKGZyb20gKyAxKSArICdcIj48L2k+ICcgK1xuICAgICAgICBmcm9tICsgKHRvID8gJyZuZGFzaDsnICsgdG8gOiAnKycpKTtcbiAgfVxuXG4gIHJldHVybiAnPGg1PlByb2plY3RzIHBlciBDb3VudHk8L2g1PicgKyBsYWJlbHMuam9pbignPGJyPicpO1xufTtcblxudmFyIHJlbmRlckF2Z0Nvc3RMZWdlbmQgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBncmFkZXMgPSBbMCwgNTAwMDAwMDAwLCAxMDAwMDAwMDAwLCAxNTAwMDAwMDAwLCAyMDAwMDAwMDAwLCAyNTAwMDAwMDAwXSxcbiAgbGFiZWxzID0gW10sXG4gIGZyb20sIHRvO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZ3JhZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgZnJvbSA9IGdyYWRlc1tpXTtcbiAgICB0byA9IGdyYWRlc1tpICsgMV07XG5cbiAgICBsYWJlbHMucHVzaChcbiAgICAgICc8aSBzdHlsZT1cImJhY2tncm91bmQ6JyArIGF2Z0Nvc3RUb0NvbG91cihmcm9tICsgMSkgKyAnXCI+PC9pPiAnICtcbiAgICAgICAgZnJvbSArICh0byA/ICcmbmRhc2g7JyArIHRvIDogJysnKSk7XG4gIH1cblxuICByZXR1cm4gJzxoNT5BdmcuIENvc3QgcGVyIENvdW50eSAoS0VTKTwvaDU+JyArIGxhYmVscy5qb2luKCc8YnI+Jyk7XG59O1xuXG5sZWdlbmRDb250cm9sLm9uQWRkID0gZnVuY3Rpb24gKCkge1xuXG4gIHZhciBkaXYgPSBMLkRvbVV0aWwuY3JlYXRlKCdkaXYnLCAnaW5mbyBsZWdlbmQnKTtcblxuICBkaXYuaW5uZXJIVE1MID0gJzxoND5MZWdlbmQ8L2g0PicgK1xuICAgIHJlbmRlclByb2plY3RzTGVnZW5kKCkgK1xuICAgIHJlbmRlckF2Z0Nvc3RMZWdlbmQoKTtcblxuICByZXR1cm4gZGl2O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBsZWdlbmRDb250cm9sO1xuXG4iLCJ2YXIgZ3JvdXAgPSBMLmxheWVyR3JvdXAoKTtcblxudmFyIG9uRGF0YVJlY2VpdmVkID0gZnVuY3Rpb24gKGUpIHtcbiAgaWYgKGUuZGF0YVR5cGUgPT09ICdwcm9qZWN0cycgJiYgZS5kYXRhICYmIGUuZGF0YS5sZW5ndGgpIHtcbiAgICB2YXIgcHJvamVjdHMgPSBlLmRhdGE7XG5cbiAgICBmb3IgKHZhciBpPTA7IGk8cHJvamVjdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChwcm9qZWN0c1tpXS5tYXJrZXIpIHtcbiAgICAgICAgcHJvamVjdHNbaV0ubWFya2VyLmFkZFRvKGdyb3VwKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCkge1xuICB3aW5kb3cubWFwLm9uKCdkYXRhUmVjZWl2ZWQnLCBvbkRhdGFSZWNlaXZlZCk7XG4gIHJldHVybiBncm91cDtcbn07XG5cbiIsInZhciBncm91cCA9IEwubGF5ZXJHcm91cCgpO1xuXG52YXIgb25EYXRhUmVjZWl2ZWQgPSBmdW5jdGlvbiAoZSkge1xuICBpZiAoZS5kYXRhVHlwZSA9PT0gJ3Byb2plY3RzJyAmJiBlLmRhdGEgJiYgZS5kYXRhLmxlbmd0aCkge1xuICAgIHZhciBwcm9qZWN0cyA9IGUuZGF0YTtcblxuICAgIGZvciAodmFyIGk9MDsgaTxwcm9qZWN0cy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHByb2plY3RzW2ldLm1hcmtlcikge1xuICAgICAgICBpZiAocHJvamVjdHNbaV0uZW5kRGF0ZVBsYW5uZWQgJiZcbiAgICAgICAgICAhcHJvamVjdHNbaV0uZW5kRGF0ZUFjdHVhbCAmJlxuICAgICAgICAgIG1vbWVudChwcm9qZWN0c1tpXS5lbmREYXRlUGxhbm5lZCkuaXNCZWZvcmUobW9tZW50KCkpKSB7XG4gICAgICAgICAgcHJvamVjdHNbaV0ubWFya2VyLmFkZFRvKGdyb3VwKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoKSB7XG4gIHdpbmRvdy5tYXAub24oJ2RhdGFSZWNlaXZlZCcsIG9uRGF0YVJlY2VpdmVkKTtcbiAgcmV0dXJuIGdyb3VwO1xufTtcblxuIiwidmFyIGNob3JvcGxldGhVdGlscyA9IHJlcXVpcmUoJy4uL3V0aWwvY2hvcm9wbGV0aC11dGlscycpO1xuXG52YXIgY291bnRpZXNMYXllciwgY291bnRpZXNEYXRhLCBwcm9qZWN0cztcblxuZnVuY3Rpb24gZ2V0QXZnQ29zdEZvckNvdW50eShuYW1lKSB7XG4gIHZhciBjb3N0ID0gMCwgY291bnQgPSAwO1xuXG4gIGZvciAodmFyIGk9MDsgaTxwcm9qZWN0cy5sZW5ndGg7IGkrKykge1xuICAgIGlmIChwcm9qZWN0c1tpXS5tYXJrZXIgJiYgcHJvamVjdHNbaV0uY291bnR5ID09PSBuYW1lICYmIHByb2plY3RzW2ldLnRvdGFsUHJvamVjdENvc3QgJiYgIWlzTmFOKHBhcnNlRmxvYXQocHJvamVjdHNbaV0udG90YWxQcm9qZWN0Q29zdCkpKSB7XG4gICAgICBjb3N0ICs9IHBhcnNlRmxvYXQocHJvamVjdHNbaV0udG90YWxQcm9qZWN0Q29zdCk7XG4gICAgICBjb3VudCsrO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBjb3N0IC8gY291bnQ7XG59XG5cbmZ1bmN0aW9uIHN0eWxlKGZlYXR1cmUpIHtcbiAgcmV0dXJuIHtcbiAgICBmaWxsQ29sb3I6IGNob3JvcGxldGhVdGlscy5hdmdDb3N0VG9Db2xvdXIoZ2V0QXZnQ29zdEZvckNvdW50eShmZWF0dXJlLnByb3BlcnRpZXMuQ09VTlRZX05BTSkpLFxuICAgIHdlaWdodDogMixcbiAgICBvcGFjaXR5OiAxLFxuICAgIGNvbG9yOiAnd2hpdGUnLFxuICAgIGRhc2hBcnJheTogJzMnLFxuICAgIGZpbGxPcGFjaXR5OiAwLjdcbiAgfTtcbn1cblxuZnVuY3Rpb24gem9vbVRvRmVhdHVyZShlKSB7XG4gIG1hcC5maXRCb3VuZHMoZS50YXJnZXQuZ2V0Qm91bmRzKCkpO1xufVxuXG5mdW5jdGlvbiBvbkVhY2hGZWF0dXJlKGZlYXR1cmUsIGxheWVyKSB7XG4gIGxheWVyLm9uKHtcbiAgICBjbGljazogem9vbVRvRmVhdHVyZVxuICB9KTtcbn1cblxuZnVuY3Rpb24gZHJhd0dlb0pTT04oKSB7XG4gIGNvdW50aWVzTGF5ZXIuY2xlYXJMYXllcnMoKTtcblxuICB2YXIgbCA9IEwuZ2VvSnNvbihjb3VudGllc0RhdGEsIHtcbiAgICBzdHlsZTogc3R5bGUsXG4gICAgb25FYWNoRmVhdHVyZTogb25FYWNoRmVhdHVyZVxuICB9KTtcblxuICBsLmFkZFRvKGNvdW50aWVzTGF5ZXIpO1xufVxuXG5mdW5jdGlvbiBvbkRhdGFSZWNlaXZlZCAoZSkge1xuICBpZiAoZS5kYXRhVHlwZSA9PT0gJ2NvdW50aWVzJyAmJiBlLmRhdGEpIHtcbiAgICBjb3VudGllc0RhdGEgPSBlLmRhdGE7XG4gIH0gZWxzZSBpZiAoZS5kYXRhVHlwZSA9PT0gJ3Byb2plY3RzJyAmJiBlLmRhdGEgJiYgZS5kYXRhLmxlbmd0aCkge1xuICAgIHByb2plY3RzID0gZS5kYXRhO1xuICB9XG5cbiAgaWYgKGNvdW50aWVzRGF0YSAmJiBwcm9qZWN0cykge1xuICAgIGRyYXdHZW9KU09OKCk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoKSB7XG4gIGNvdW50aWVzTGF5ZXIgPSBMLmxheWVyR3JvdXAoKTtcblxuICB3aW5kb3cubWFwLm9uKCdkYXRhUmVjZWl2ZWQnLCBvbkRhdGFSZWNlaXZlZCk7XG5cbiAgcmV0dXJuIGNvdW50aWVzTGF5ZXI7XG59O1xuXG4iLCJ2YXIgY2x1c3RlcnNMYXllcjtcblxudmFyIG9uRGF0YVJlY2VpdmVkID0gZnVuY3Rpb24gKGUpIHtcbiAgaWYgKGUuZGF0YVR5cGUgPT09ICdwcm9qZWN0cycgJiYgZS5kYXRhICYmIGUuZGF0YS5sZW5ndGgpIHtcbiAgICB2YXIgcHJvamVjdHMgPSBlLmRhdGE7XG5cbiAgICBmb3IgKHZhciBpPTA7IGk8cHJvamVjdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChwcm9qZWN0c1tpXS5tYXJrZXIpIHtcbiAgICAgICAgY2x1c3RlcnNMYXllci5hZGRMYXllcihwcm9qZWN0c1tpXS5tYXJrZXIpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoKSB7XG5cbiAgY2x1c3RlcnNMYXllciA9IEwubWFya2VyQ2x1c3Rlckdyb3VwKHtzaG93Q292ZXJhZ2VPbkhvdmVyOiBmYWxzZSwgem9vbVRvQm91bmRzT25DbGljazogdHJ1ZX0pO1xuXG4gIHdpbmRvdy5tYXAub24oJ2RhdGFSZWNlaXZlZCcsIG9uRGF0YVJlY2VpdmVkKTtcblxuICByZXR1cm4gY2x1c3RlcnNMYXllcjtcbn07XG5cbiIsInZhciBjaG9yb3BsZXRoVXRpbHMgPSByZXF1aXJlKCcuLi91dGlsL2Nob3JvcGxldGgtdXRpbHMnKTtcblxudmFyIGNvdW50aWVzTGF5ZXIsIGNvdW50aWVzRGF0YSwgcHJvamVjdHM7XG5cbmZ1bmN0aW9uIGdldFByb2plY3RDb3VudEZvckNvdW50eShuYW1lKSB7XG4gIHZhciBjb3VudCA9IDA7XG5cbiAgZm9yICh2YXIgaT0wOyBpPHByb2plY3RzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHByb2plY3RzW2ldLm1hcmtlciAmJiBwcm9qZWN0c1tpXS5jb3VudHkgPT09IG5hbWUpIHtcbiAgICAgIGNvdW50Kys7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGNvdW50O1xufVxuXG5mdW5jdGlvbiBzdHlsZShmZWF0dXJlKSB7XG4gIHJldHVybiB7XG4gICAgZmlsbENvbG9yOiBjaG9yb3BsZXRoVXRpbHMucHJvamVjdENvdW50VG9Db2xvdXIoZ2V0UHJvamVjdENvdW50Rm9yQ291bnR5KGZlYXR1cmUucHJvcGVydGllcy5DT1VOVFlfTkFNKSksXG4gICAgd2VpZ2h0OiAyLFxuICAgIG9wYWNpdHk6IDEsXG4gICAgY29sb3I6ICd3aGl0ZScsXG4gICAgZGFzaEFycmF5OiAnMycsXG4gICAgZmlsbE9wYWNpdHk6IDAuN1xuICB9O1xufVxuXG5mdW5jdGlvbiB6b29tVG9GZWF0dXJlKGUpIHtcbiAgbWFwLmZpdEJvdW5kcyhlLnRhcmdldC5nZXRCb3VuZHMoKSk7XG59XG5cbmZ1bmN0aW9uIG9uRWFjaEZlYXR1cmUoZmVhdHVyZSwgbGF5ZXIpIHtcbiAgbGF5ZXIub24oe1xuICAgIGNsaWNrOiB6b29tVG9GZWF0dXJlXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBkcmF3R2VvSlNPTigpIHtcbiAgY291bnRpZXNMYXllci5jbGVhckxheWVycygpO1xuXG4gIHZhciBsID0gTC5nZW9Kc29uKGNvdW50aWVzRGF0YSwge1xuICAgIHN0eWxlOiBzdHlsZSxcbiAgICBvbkVhY2hGZWF0dXJlOiBvbkVhY2hGZWF0dXJlXG4gIH0pO1xuXG4gIGwuYWRkVG8oY291bnRpZXNMYXllcik7XG59XG5cbmZ1bmN0aW9uIG9uRGF0YVJlY2VpdmVkIChlKSB7XG4gIGlmIChlLmRhdGFUeXBlID09PSAnY291bnRpZXMnICYmIGUuZGF0YSkge1xuICAgIGNvdW50aWVzRGF0YSA9IGUuZGF0YTtcbiAgfSBlbHNlIGlmIChlLmRhdGFUeXBlID09PSAncHJvamVjdHMnICYmIGUuZGF0YSAmJiBlLmRhdGEubGVuZ3RoKSB7XG4gICAgcHJvamVjdHMgPSBlLmRhdGE7XG4gIH1cblxuICBpZiAoY291bnRpZXNEYXRhICYmIHByb2plY3RzKSB7XG4gICAgZHJhd0dlb0pTT04oKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHtcbiAgY291bnRpZXNMYXllciA9IEwubGF5ZXJHcm91cCgpO1xuXG4gIHdpbmRvdy5tYXAub24oJ2RhdGFSZWNlaXZlZCcsIG9uRGF0YVJlY2VpdmVkKTtcblxuICByZXR1cm4gY291bnRpZXNMYXllcjtcbn07XG5cbiIsInZhciBtYXJrZXJzTGF5ZXI7XG5cbnZhciBta0hvdmVyRnVuY3Rpb24gPSBmdW5jdGlvbiAocHJvamVjdCkge1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHdpbmRvdy5tYXAuZmlyZUV2ZW50KCdzaG93UHJvamVjdERldGFpbHMnLCB7cHJvamVjdDogcHJvamVjdH0pO1xuICB9O1xufTtcblxudmFyIG9uRGF0YVJlY2VpdmVkID0gZnVuY3Rpb24gKGUpIHtcblxuICBpZiAoZS5kYXRhVHlwZSA9PT0gJ3Byb2plY3RzJyAmJiBlLmRhdGEgJiYgZS5kYXRhLmxlbmd0aCkge1xuXG4gICAgdmFyIHByb2plY3RzID0gZS5kYXRhO1xuXG4gICAgZm9yICh2YXIgaT0wOyBpPHByb2plY3RzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAocHJvamVjdHNbaV0ubG5nICYmIHByb2plY3RzW2ldLmxhdCkge1xuICAgICAgICBwcm9qZWN0c1tpXS5tYXJrZXIgPSBMLm1hcmtlcihbcHJvamVjdHNbaV0ubGF0LCBwcm9qZWN0c1tpXS5sbmddKTtcblxuICAgICAgICBwcm9qZWN0c1tpXS5tYXJrZXIub24oJ21vdXNlb3ZlcicsIG1rSG92ZXJGdW5jdGlvbihwcm9qZWN0c1tpXSkpO1xuICAgICAgICBwcm9qZWN0c1tpXS5tYXJrZXIub24oJ21vdXNlb3V0JywgbWtIb3ZlckZ1bmN0aW9uKG51bGwpKTtcblxuICAgICAgICBtYXJrZXJzTGF5ZXIuYWRkTGF5ZXIocHJvamVjdHNbaV0ubWFya2VyKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoKSB7XG4gIG1hcmtlcnNMYXllciA9IEwubGF5ZXJHcm91cCgpO1xuXG4gIHdpbmRvdy5tYXAub24oJ2RhdGFSZWNlaXZlZCcsIG9uRGF0YVJlY2VpdmVkKTtcblxuICByZXR1cm4gbWFya2Vyc0xheWVyO1xufTtcblxuIiwibW9kdWxlLmV4cG9ydHMgPSBMLnRpbGVMYXllcignaHR0cDovL3tzfS5iYXNlbWFwcy5jYXJ0b2Nkbi5jb20vbGlnaHRfYWxsL3t6fS97eH0ve3l9LnBuZycsIHtcbiAgYXR0cmlidXRpb246ICcmY29weTsgPGEgaHJlZj1cImh0dHA6Ly93d3cub3BlbnN0cmVldG1hcC5vcmcvY29weXJpZ2h0XCI+T3BlblN0cmVldE1hcDwvYT4gY29udHJpYnV0b3JzLCAmY29weTsgPGEgaHJlZj1cImh0dHA6Ly9jYXJ0b2RiLmNvbS9hdHRyaWJ1dGlvbnNcIj5DYXJ0b0RCPC9hPidcbn0pO1xuIiwidmFyIE1BUF9DRU5URVIgPSBbMC41LCAzOV07XG52YXIgTUFQX1pPT00gPSA2O1xuXG4kKGZ1bmN0aW9uICgpIHtcblxuICB2YXIgbGF5ZXJzID0ge30sIGNvbnRyb2xzID0ge307XG5cbiAgd2luZG93Lm1hcCA9IEwubWFwKCdtYXAnLCB7XG4gICAgc2Nyb2xsV2hlZWxab29tOiBmYWxzZSxcbiAgICBjZW50ZXI6IE1BUF9DRU5URVIsXG4gICAgem9vbTogTUFQX1pPT01cbiAgfSk7XG5cbiAgbGF5ZXJzLnRpbGVzID0gcmVxdWlyZSgnLi9sYXllcnMvdGlsZXMtbGF5ZXInKTtcbiAgbGF5ZXJzLm1hcmtlcnMgPSByZXF1aXJlKCcuL2xheWVycy9tYXJrZXJzLWxheWVyJykoKTtcbiAgbGF5ZXJzLmNsdXN0ZXJzID0gcmVxdWlyZSgnLi9sYXllcnMvY2x1c3RlcnMtbGF5ZXInKSgpO1xuICBsYXllcnMucHJvamVjdHNQZXJDb3VudHkgPSByZXF1aXJlKCcuL2xheWVycy9jb3VudGllcy1sYXllcicpKCk7XG4gIGxheWVycy5hdmdDb3N0UGVyQ291bnR5ID0gcmVxdWlyZSgnLi9sYXllcnMvYXZnY29zdC1sYXllcicpKCk7XG5cbiAgbGF5ZXJzLnRpbGVzLmFkZFRvKG1hcCk7XG4gIGxheWVycy5tYXJrZXJzLmFkZFRvKG1hcCk7XG4gIGxheWVycy5wcm9qZWN0c1BlckNvdW50eS5hZGRUbyhtYXApO1xuICBsYXllcnMuYXZnQ29zdFBlckNvdW50eS5hZGRUbyhtYXApO1xuXG4gIHZhciBmaWx0ZXJHcm91cHMgPSB7XG4gICAgYWxsOiByZXF1aXJlKCcuL2ZpbHRlcnMvYWxsLWZpbHRlcicpKCksXG4gICAgb3ZlcnRpbWU6IHJlcXVpcmUoJy4vZmlsdGVycy9vdmVydGltZS1maWx0ZXInKSgpXG4gIH07XG5cbiAgY29udHJvbHMuaW5mbyA9IHJlcXVpcmUoJy4vY29udHJvbHMvaW5mby1jb250cm9sJyk7XG4gIGNvbnRyb2xzLmxlZ2VuZCA9IHJlcXVpcmUoJy4vY29udHJvbHMvbGVnZW5kLWNvbnRyb2wnKTtcbiAgY29udHJvbHMuY2x1c3RlciA9IHJlcXVpcmUoJy4vY29udHJvbHMvY2x1c3Rlci1jb250cm9sJyk7XG4gIGNvbnRyb2xzLmZpbHRlciA9IHJlcXVpcmUoJy4vY29udHJvbHMvZmlsdGVyZWQtbGF5ZXItY29udHJvbCcpKGZpbHRlckdyb3Vwcyk7XG4gIGNvbnRyb2xzLmNvdW50aWVzID0gcmVxdWlyZSgnLi9jb250cm9scy9jb3VudHktbGF5ZXItY29udHJvbCcpKFtsYXllcnMucHJvamVjdHNQZXJDb3VudHksIGxheWVycy5hdmdDb3N0UGVyQ291bnR5XSk7XG4gIFxuICBjb250cm9scy5pbmZvLmFkZFRvKG1hcCk7XG4gIGNvbnRyb2xzLmxlZ2VuZC5hZGRUbyhtYXApO1xuICBjb250cm9scy5jbHVzdGVyLmFkZFRvKG1hcCk7XG4gIGNvbnRyb2xzLmZpbHRlci5hZGRUbyhtYXApO1xuICBjb250cm9scy5jb3VudGllcy5hZGRUbyhtYXApO1xuXG4gIG1hcC5vbignaGlkZUxheWVyJywgZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAobGF5ZXJzW2UubGF5ZXJdKSB7XG4gICAgICBtYXAucmVtb3ZlTGF5ZXIobGF5ZXJzW2UubGF5ZXJdKTtcbiAgICB9XG4gIH0pO1xuXG4gIG1hcC5vbignc2hvd0xheWVyJywgZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAobGF5ZXJzW2UubGF5ZXJdKSB7XG4gICAgICBtYXAuYWRkTGF5ZXIobGF5ZXJzW2UubGF5ZXJdKTtcbiAgICB9XG4gIH0pO1xuXG4gIG1hcC5vbignaGlkZUNvbnRyb2wnLCBmdW5jdGlvbiAoZSkge1xuICAgIGlmIChjb250cm9sc1tlLmNvbnRyb2xdKSB7XG4gICAgICBtYXAucmVtb3ZlQ29udHJvbChjb250cm9sc1tlLmNvbnRyb2xdKTtcbiAgICB9XG4gIH0pO1xuXG4gIG1hcC5vbignc2hvd0NvbnRyb2wnLCBmdW5jdGlvbiAoZSkge1xuICAgIGlmIChjb250cm9sc1tlLmNvbnRyb2xdKSB7XG4gICAgICBtYXAuYWRkQ29udHJvbChjb250cm9sc1tlLmNvbnRyb2xdKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJlcXVpcmUoJy4vc2VydmljZXMvcHJvamVjdHMtc2VydmljZScpLmZldGNoQWxsKCk7XG4gIHJlcXVpcmUoJy4vc2VydmljZXMvY291bnRpZXMtc2VydmljZScpLmZldGNoQWxsKCk7XG5cbn0pO1xuIiwid2luZG93LmRhdGEgPSB3aW5kb3cuZGF0YSB8fCB7fTtcblxubW9kdWxlLmV4cG9ydHMuZmV0Y2hBbGwgPSBmdW5jdGlvbiAoKSB7XG5cbiAgJC5nZXQoJy9kYXRhL2NvdW50aWVzLmpzb24nKS50aGVuKGZ1bmN0aW9uIChkYXRhKSB7XG5cbiAgICB3aW5kb3cubWFwLmZpcmVFdmVudCgnZGF0YVJlY2VpdmVkJywge2RhdGFUeXBlOiAnY291bnRpZXMnLCBkYXRhOiBkYXRhfSk7XG5cbiAgfSwgZnVuY3Rpb24gKGVycikge1xuXG4gICAgYWxlcnQoJ0NvdWxkIG5vdCBmZXRjaCBjb3VudGllcyBKU09OLicpO1xuXG4gIH0pO1xuXG59O1xuIiwid2luZG93LmRhdGEgPSB3aW5kb3cuZGF0YSB8fCB7fTtcblxubW9kdWxlLmV4cG9ydHMuZmV0Y2hBbGwgPSBmdW5jdGlvbiAoKSB7XG5cbiAgJC5nZXQoJy9kYXRhL3Byb2plY3RzLmpzb24nKS50aGVuKGZ1bmN0aW9uIChkYXRhKSB7XG5cbiAgICB3aW5kb3cubWFwLmZpcmVFdmVudCgnZGF0YVJlY2VpdmVkJywge2RhdGFUeXBlOiAncHJvamVjdHMnLCBkYXRhOiBkYXRhLnByb2plY3RzfSk7XG5cbiAgfSwgZnVuY3Rpb24gKGVycikge1xuXG4gICAgYWxlcnQoJ0NvdWxkIG5vdCBmZXRjaCBwcm9qZWN0cyBKU09OLicpO1xuXG4gIH0pO1xuXG59O1xuIiwibW9kdWxlLmV4cG9ydHMucHJvamVjdENvdW50VG9Db2xvdXIgPSBmdW5jdGlvbiAoZCkge1xuICByZXR1cm4gZCA+IDUwID8gJyM4MTBmN2MnIDpcbiAgZCA+IDQwICA/ICcjODg1NmE3JyA6XG4gIGQgPiAzMCAgID8gJyM4Yzk2YzYnIDpcbiAgZCA+IDIwICAgPyAnIzllYmNkYScgOlxuICBkID4gMTAgICA/ICcjYmZkM2U2JyA6XG4gICcjZWRmOGZiJztcbn07XG5cbm1vZHVsZS5leHBvcnRzLmF2Z0Nvc3RUb0NvbG91ciA9IGZ1bmN0aW9uIChkKSB7XG4gIHJldHVybiBkID4gMjUwMDAwMDAwMCA/ICcjYjMwMDAwJyA6XG4gIGQgPiAyMDAwMDAwMDAwICA/ICcjZTM0YTMzJyA6XG4gIGQgPiAxNTAwMDAwMDAwICAgPyAnI2ZjOGQ1OScgOlxuICBkID4gMTAwMDAwMDAwMCAgID8gJyNmZGJiODQnIDpcbiAgZCA+IDUwMDAwMDAwMCAgID8gJyNmZGQ0OWUnIDpcbiAgJyNmZWYwZDknO1xufTtcblxuIl19
