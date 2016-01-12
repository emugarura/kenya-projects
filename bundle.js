(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var isClusteringEnabled = false;

module.exports = L.easyButton('fa-map-marker', function(btn, map) {

  if (isClusteringEnabled) {
    window.map.fireEvent('hideLayer', {layer: 'clusters'});
    window.map.fireEvent('showLayer', {layer: 'markers'});
  } else {
    window.map.fireEvent('hideLayer', {layer: 'markers'});
    window.map.fireEvent('showLayer', {layer: 'clusters'});
  }

  isClusteringEnabled = !isClusteringEnabled;

});


},{}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
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


},{"../util/choropleth-utils":11}],4:[function(require,module,exports){
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


},{}],5:[function(require,module,exports){
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


},{"../util/choropleth-utils":11}],6:[function(require,module,exports){
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


},{}],7:[function(require,module,exports){
module.exports = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
});

},{}],8:[function(require,module,exports){
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

},{"./controls/cluster-control":1,"./controls/info-control":2,"./controls/legend-control":3,"./layers/clusters-layer":4,"./layers/counties-layer":5,"./layers/markers-layer":6,"./layers/tiles-layer":7,"./services/counties-service":9,"./services/projects-service":10}],9:[function(require,module,exports){
window.data = window.data || {};

module.exports.fetchAll = function () {

  $.get('/data/counties.json').then(function (data) {

    window.map.fireEvent('dataReceived', {dataType: 'counties', data: data});

  }, function (err) {

    alert('Could not fetch counties JSON.');

  });

};

},{}],10:[function(require,module,exports){
window.data = window.data || {};

module.exports.fetchAll = function () {

  $.get('/data/projects.json').then(function (data) {

    window.map.fireEvent('dataReceived', {dataType: 'projects', data: data.projects});

  }, function (err) {

    alert('Could not fetch projects JSON.');

  });

};

},{}],11:[function(require,module,exports){
module.exports.projectCountToColour = function (d) {
  return d > 50 ? '#800026' :
  d > 40  ? '#FC4E2A' :
  d > 30   ? '#FD8D3C' :
  d > 20   ? '#FEB24C' :
  d > 10   ? '#FED976' :
  '#FFEDA0';
};


},{}]},{},[8])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy5udm0vdmVyc2lvbnMvbm9kZS92NS4xLjAvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwianMvY29udHJvbHMvY2x1c3Rlci1jb250cm9sLmpzIiwianMvY29udHJvbHMvaW5mby1jb250cm9sLmpzIiwianMvY29udHJvbHMvbGVnZW5kLWNvbnRyb2wuanMiLCJqcy9sYXllcnMvY2x1c3RlcnMtbGF5ZXIuanMiLCJqcy9sYXllcnMvY291bnRpZXMtbGF5ZXIuanMiLCJqcy9sYXllcnMvbWFya2Vycy1sYXllci5qcyIsImpzL2xheWVycy90aWxlcy1sYXllci5qcyIsImpzL21haW4uanMiLCJqcy9zZXJ2aWNlcy9jb3VudGllcy1zZXJ2aWNlLmpzIiwianMvc2VydmljZXMvcHJvamVjdHMtc2VydmljZS5qcyIsImpzL3V0aWwvY2hvcm9wbGV0aC11dGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgaXNDbHVzdGVyaW5nRW5hYmxlZCA9IGZhbHNlO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEwuZWFzeUJ1dHRvbignZmEtbWFwLW1hcmtlcicsIGZ1bmN0aW9uKGJ0biwgbWFwKSB7XG5cbiAgaWYgKGlzQ2x1c3RlcmluZ0VuYWJsZWQpIHtcbiAgICB3aW5kb3cubWFwLmZpcmVFdmVudCgnaGlkZUxheWVyJywge2xheWVyOiAnY2x1c3RlcnMnfSk7XG4gICAgd2luZG93Lm1hcC5maXJlRXZlbnQoJ3Nob3dMYXllcicsIHtsYXllcjogJ21hcmtlcnMnfSk7XG4gIH0gZWxzZSB7XG4gICAgd2luZG93Lm1hcC5maXJlRXZlbnQoJ2hpZGVMYXllcicsIHtsYXllcjogJ21hcmtlcnMnfSk7XG4gICAgd2luZG93Lm1hcC5maXJlRXZlbnQoJ3Nob3dMYXllcicsIHtsYXllcjogJ2NsdXN0ZXJzJ30pO1xuICB9XG5cbiAgaXNDbHVzdGVyaW5nRW5hYmxlZCA9ICFpc0NsdXN0ZXJpbmdFbmFibGVkO1xuXG59KTtcblxuIiwidmFyIGluZm9Db250cm9sID0gTC5jb250cm9sKHtwb3NpdGlvbjogJ3RvcHJpZ2h0J30pO1xuXG5pbmZvQ29udHJvbC51cGRhdGUgPSBmdW5jdGlvbiAoZSkge1xuICB2YXIgcHJvamVjdCA9IGUgPyBlLnByb2plY3QgOiB1bmRlZmluZWQ7XG4gIFxuICB0aGlzLl9kaXYuaW5uZXJIVE1MID0gIChwcm9qZWN0ID9cbiAgICAnPGg0PicgKyAocHJvamVjdC50aXRsZSA/IHByb2plY3QudGl0bGUgOiAnUHJvamVjdCBpbiAnICsgcHJvamVjdC5jb25zdGl0dWVuY3kpICsgJzwvaDQ+JyArXG4gICAgICAocHJvamVjdC5kZXNjcmlwdGlvbiA/ICc8cD4nICsgcHJvamVjdC5kZXNjcmlwdGlvbiArICc8L3A+JyA6ICc8cD5ObyBEZXNjcmlwdGlvbjwvcD4nKSArXG4gICAgICAocHJvamVjdC5vYmplY3RpdmVzID8gJzxoNT5PYmplY3RpdmVzPC9oNT48cD4nICsgcHJvamVjdC5vYmplY3RpdmVzICsgJzwvcD4nIDogJycpIFxuICA6ICc8aDQ+RG9ub3IgYW5kIEdvdmVybm1lbnQgRnVuZGVkIFByb2plY3RzIGluIEtlbnlhPC9oND4nKTtcbn07XG5cbmluZm9Db250cm9sLm9uQWRkID0gZnVuY3Rpb24gKG1hcCkge1xuICB0aGlzLl9kaXYgPSBMLkRvbVV0aWwuY3JlYXRlKCdkaXYnLCAnaW5mbyBwcm9qZWN0LWluZm8nKTtcblxuICB3aW5kb3cubWFwLm9uKCdzaG93UHJvamVjdERldGFpbHMnLCBpbmZvQ29udHJvbC51cGRhdGUuYmluZCh0aGlzKSk7XG5cbiAgaW5mb0NvbnRyb2wudXBkYXRlKCk7XG5cbiAgcmV0dXJuIHRoaXMuX2Rpdjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gaW5mb0NvbnRyb2w7XG4iLCJ2YXIgcHJvamVjdENvdW50VG9Db2xvdXIgPSByZXF1aXJlKCcuLi91dGlsL2Nob3JvcGxldGgtdXRpbHMnKS5wcm9qZWN0Q291bnRUb0NvbG91cjtcblxudmFyIGxlZ2VuZENvbnRyb2wgPSBMLmNvbnRyb2woe3Bvc2l0aW9uOiAnYm90dG9tcmlnaHQnfSk7XG5cbmxlZ2VuZENvbnRyb2wub25BZGQgPSBmdW5jdGlvbiAobWFwKSB7XG5cbiAgdmFyIGRpdiA9IEwuRG9tVXRpbC5jcmVhdGUoJ2RpdicsICdpbmZvIGxlZ2VuZCcpLFxuICBncmFkZXMgPSBbMCwgMTAsIDIwLCAzMCwgNDAsIDUwXSxcbiAgbGFiZWxzID0gW10sXG4gIGZyb20sIHRvO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZ3JhZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgZnJvbSA9IGdyYWRlc1tpXTtcbiAgICB0byA9IGdyYWRlc1tpICsgMV07XG5cbiAgICBsYWJlbHMucHVzaChcbiAgICAgICc8aSBzdHlsZT1cImJhY2tncm91bmQ6JyArIHByb2plY3RDb3VudFRvQ29sb3VyKGZyb20gKyAxKSArICdcIj48L2k+ICcgK1xuICAgICAgICBmcm9tICsgKHRvID8gJyZuZGFzaDsnICsgdG8gOiAnKycpKTtcbiAgfVxuXG4gIGRpdi5pbm5lckhUTUwgPSAnPGg0PkxlZ2VuZDwvaDQ+PGg1PlByb2plY3RzIHBlciBDb3VudHk8L2g1PicgKyBsYWJlbHMuam9pbignPGJyPicpO1xuICByZXR1cm4gZGl2O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBsZWdlbmRDb250cm9sO1xuXG4iLCJ2YXIgY2x1c3RlcnNMYXllcjtcblxudmFyIG9uRGF0YVJlY2VpdmVkID0gZnVuY3Rpb24gKGUpIHtcbiAgaWYgKGUuZGF0YVR5cGUgPT09ICdwcm9qZWN0cycgJiYgZS5kYXRhICYmIGUuZGF0YS5sZW5ndGgpIHtcbiAgICB2YXIgcHJvamVjdHMgPSBlLmRhdGE7XG5cbiAgICBmb3IgKHZhciBpPTA7IGk8cHJvamVjdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChwcm9qZWN0c1tpXS5tYXJrZXIpIHtcbiAgICAgICAgY2x1c3RlcnNMYXllci5hZGRMYXllcihwcm9qZWN0c1tpXS5tYXJrZXIpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoKSB7XG5cbiAgY2x1c3RlcnNMYXllciA9IEwubWFya2VyQ2x1c3Rlckdyb3VwKHtzaG93Q292ZXJhZ2VPbkhvdmVyOiBmYWxzZSwgem9vbVRvQm91bmRzT25DbGljazogdHJ1ZX0pO1xuXG4gIHdpbmRvdy5tYXAub24oJ2RhdGFSZWNlaXZlZCcsIG9uRGF0YVJlY2VpdmVkKTtcblxuICByZXR1cm4gY2x1c3RlcnNMYXllcjtcbn07XG5cbiIsInZhciBjaG9yb3BsZXRoVXRpbHMgPSByZXF1aXJlKCcuLi91dGlsL2Nob3JvcGxldGgtdXRpbHMnKTtcblxudmFyIGNvdW50aWVzTGF5ZXIsIGNvdW50aWVzRGF0YSwgcHJvamVjdHM7XG5cbmZ1bmN0aW9uIGdldFByb2plY3RDb3VudEZvckNvdW50eShuYW1lKSB7XG4gIHZhciBjb3VudCA9IDA7XG5cbiAgZm9yICh2YXIgaT0wOyBpPHByb2plY3RzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHByb2plY3RzW2ldLm1hcmtlciAmJiBwcm9qZWN0c1tpXS5jb3VudHkgPT09IG5hbWUpIHtcbiAgICAgIGNvdW50Kys7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGNvdW50O1xufVxuXG5mdW5jdGlvbiBzdHlsZShmZWF0dXJlKSB7XG4gIHJldHVybiB7XG4gICAgZmlsbENvbG9yOiBjaG9yb3BsZXRoVXRpbHMucHJvamVjdENvdW50VG9Db2xvdXIoZ2V0UHJvamVjdENvdW50Rm9yQ291bnR5KGZlYXR1cmUucHJvcGVydGllcy5DT1VOVFlfTkFNKSksXG4gICAgd2VpZ2h0OiAyLFxuICAgIG9wYWNpdHk6IDEsXG4gICAgY29sb3I6ICd3aGl0ZScsXG4gICAgZGFzaEFycmF5OiAnMycsXG4gICAgZmlsbE9wYWNpdHk6IDAuN1xuICB9O1xufVxuXG5mdW5jdGlvbiB6b29tVG9GZWF0dXJlKGUpIHtcbiAgbWFwLmZpdEJvdW5kcyhlLnRhcmdldC5nZXRCb3VuZHMoKSk7XG59XG5cbmZ1bmN0aW9uIG9uRWFjaEZlYXR1cmUoZmVhdHVyZSwgbGF5ZXIpIHtcbiAgbGF5ZXIub24oe1xuICAgIGNsaWNrOiB6b29tVG9GZWF0dXJlXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBkcmF3R2VvSlNPTigpIHtcbiAgY291bnRpZXNMYXllci5jbGVhckxheWVycygpO1xuXG4gIHZhciBsID0gTC5nZW9Kc29uKGNvdW50aWVzRGF0YSwge1xuICAgIHN0eWxlOiBzdHlsZSxcbiAgICBvbkVhY2hGZWF0dXJlOiBvbkVhY2hGZWF0dXJlXG4gIH0pO1xuXG4gIGwuYWRkVG8oY291bnRpZXNMYXllcik7XG59XG5cbmZ1bmN0aW9uIG9uRGF0YVJlY2VpdmVkIChlKSB7XG4gIGlmIChlLmRhdGFUeXBlID09PSAnY291bnRpZXMnICYmIGUuZGF0YSkge1xuICAgIGNvdW50aWVzRGF0YSA9IGUuZGF0YTtcbiAgfSBlbHNlIGlmIChlLmRhdGFUeXBlID09PSAncHJvamVjdHMnICYmIGUuZGF0YSAmJiBlLmRhdGEubGVuZ3RoKSB7XG4gICAgcHJvamVjdHMgPSBlLmRhdGE7XG4gIH1cblxuICBpZiAoY291bnRpZXNEYXRhICYmIHByb2plY3RzKSB7XG4gICAgZHJhd0dlb0pTT04oKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHtcbiAgY291bnRpZXNMYXllciA9IEwubGF5ZXJHcm91cCgpO1xuXG4gIHdpbmRvdy5tYXAub24oJ2RhdGFSZWNlaXZlZCcsIG9uRGF0YVJlY2VpdmVkKTtcblxuICByZXR1cm4gY291bnRpZXNMYXllcjtcbn07XG5cbiIsInZhciBtYXJrZXJzTGF5ZXI7XG5cbnZhciBta0hvdmVyRnVuY3Rpb24gPSBmdW5jdGlvbiAocHJvamVjdCkge1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHdpbmRvdy5tYXAuZmlyZUV2ZW50KCdzaG93UHJvamVjdERldGFpbHMnLCB7cHJvamVjdDogcHJvamVjdH0pO1xuICB9O1xufTtcblxudmFyIG9uRGF0YVJlY2VpdmVkID0gZnVuY3Rpb24gKGUpIHtcblxuICBpZiAoZS5kYXRhVHlwZSA9PT0gJ3Byb2plY3RzJyAmJiBlLmRhdGEgJiYgZS5kYXRhLmxlbmd0aCkge1xuXG4gICAgdmFyIHByb2plY3RzID0gZS5kYXRhO1xuXG4gICAgZm9yICh2YXIgaT0wOyBpPHByb2plY3RzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAocHJvamVjdHNbaV0ubG5nICYmIHByb2plY3RzW2ldLmxhdCkge1xuICAgICAgICBwcm9qZWN0c1tpXS5tYXJrZXIgPSBMLm1hcmtlcihbcHJvamVjdHNbaV0ubGF0LCBwcm9qZWN0c1tpXS5sbmddKTtcblxuICAgICAgICBwcm9qZWN0c1tpXS5tYXJrZXIub24oJ21vdXNlb3ZlcicsIG1rSG92ZXJGdW5jdGlvbihwcm9qZWN0c1tpXSkpO1xuICAgICAgICBwcm9qZWN0c1tpXS5tYXJrZXIub24oJ21vdXNlb3V0JywgbWtIb3ZlckZ1bmN0aW9uKG51bGwpKTtcblxuICAgICAgICBtYXJrZXJzTGF5ZXIuYWRkTGF5ZXIocHJvamVjdHNbaV0ubWFya2VyKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoKSB7XG4gIG1hcmtlcnNMYXllciA9IEwubGF5ZXJHcm91cCgpO1xuXG4gIHdpbmRvdy5tYXAub24oJ2RhdGFSZWNlaXZlZCcsIG9uRGF0YVJlY2VpdmVkKTtcblxuICByZXR1cm4gbWFya2Vyc0xheWVyO1xufTtcblxuIiwibW9kdWxlLmV4cG9ydHMgPSBMLnRpbGVMYXllcignaHR0cDovL3tzfS5iYXNlbWFwcy5jYXJ0b2Nkbi5jb20vbGlnaHRfYWxsL3t6fS97eH0ve3l9LnBuZycsIHtcbiAgYXR0cmlidXRpb246ICcmY29weTsgPGEgaHJlZj1cImh0dHA6Ly93d3cub3BlbnN0cmVldG1hcC5vcmcvY29weXJpZ2h0XCI+T3BlblN0cmVldE1hcDwvYT4gY29udHJpYnV0b3JzLCAmY29weTsgPGEgaHJlZj1cImh0dHA6Ly9jYXJ0b2RiLmNvbS9hdHRyaWJ1dGlvbnNcIj5DYXJ0b0RCPC9hPidcbn0pO1xuIiwidmFyIE1BUF9DRU5URVIgPSBbMC41LCAzOV07XG52YXIgTUFQX1pPT00gPSA2O1xuXG52YXIgbGF5ZXJzID0ge307XG5cbiQoZnVuY3Rpb24gKCkge1xuXG4gIHdpbmRvdy5tYXAgPSBMLm1hcCgnbWFwJywge1xuICAgIHNjcm9sbFdoZWVsWm9vbTogZmFsc2UsXG4gICAgY2VudGVyOiBNQVBfQ0VOVEVSLFxuICAgIHpvb206IE1BUF9aT09NXG4gIH0pO1xuXG4gIHJlcXVpcmUoJy4vY29udHJvbHMvaW5mby1jb250cm9sJykuYWRkVG8obWFwKTtcbiAgcmVxdWlyZSgnLi9jb250cm9scy9sZWdlbmQtY29udHJvbCcpLmFkZFRvKG1hcCk7XG4gIHJlcXVpcmUoJy4vY29udHJvbHMvY2x1c3Rlci1jb250cm9sJykuYWRkVG8obWFwKTtcblxuICBsYXllcnMudGlsZXMgPSByZXF1aXJlKCcuL2xheWVycy90aWxlcy1sYXllcicpO1xuICBsYXllcnMubWFya2VycyA9IHJlcXVpcmUoJy4vbGF5ZXJzL21hcmtlcnMtbGF5ZXInKSgpO1xuICBsYXllcnMuY2x1c3RlcnMgPSByZXF1aXJlKCcuL2xheWVycy9jbHVzdGVycy1sYXllcicpKCk7XG4gIGxheWVycy5jb3VudGllcyA9IHJlcXVpcmUoJy4vbGF5ZXJzL2NvdW50aWVzLWxheWVyJykoKTtcblxuICBsYXllcnMudGlsZXMuYWRkVG8obWFwKTtcbiAgbGF5ZXJzLm1hcmtlcnMuYWRkVG8obWFwKTtcbiAgbGF5ZXJzLmNvdW50aWVzLmFkZFRvKG1hcCk7XG5cbiAgbWFwLm9uKCdoaWRlTGF5ZXInLCBmdW5jdGlvbiAoZSkge1xuICAgIGlmIChsYXllcnNbZS5sYXllcl0pIHtcbiAgICAgIG1hcC5yZW1vdmVMYXllcihsYXllcnNbZS5sYXllcl0pO1xuICAgIH1cbiAgfSk7XG5cbiAgbWFwLm9uKCdzaG93TGF5ZXInLCBmdW5jdGlvbiAoZSkge1xuICAgIGlmIChsYXllcnNbZS5sYXllcl0pIHtcbiAgICAgIG1hcC5hZGRMYXllcihsYXllcnNbZS5sYXllcl0pO1xuICAgIH1cbiAgfSk7XG5cbiAgcmVxdWlyZSgnLi9zZXJ2aWNlcy9wcm9qZWN0cy1zZXJ2aWNlJykuZmV0Y2hBbGwoKTtcbiAgcmVxdWlyZSgnLi9zZXJ2aWNlcy9jb3VudGllcy1zZXJ2aWNlJykuZmV0Y2hBbGwoKTtcblxufSk7XG4iLCJ3aW5kb3cuZGF0YSA9IHdpbmRvdy5kYXRhIHx8IHt9O1xuXG5tb2R1bGUuZXhwb3J0cy5mZXRjaEFsbCA9IGZ1bmN0aW9uICgpIHtcblxuICAkLmdldCgnL2RhdGEvY291bnRpZXMuanNvbicpLnRoZW4oZnVuY3Rpb24gKGRhdGEpIHtcblxuICAgIHdpbmRvdy5tYXAuZmlyZUV2ZW50KCdkYXRhUmVjZWl2ZWQnLCB7ZGF0YVR5cGU6ICdjb3VudGllcycsIGRhdGE6IGRhdGF9KTtcblxuICB9LCBmdW5jdGlvbiAoZXJyKSB7XG5cbiAgICBhbGVydCgnQ291bGQgbm90IGZldGNoIGNvdW50aWVzIEpTT04uJyk7XG5cbiAgfSk7XG5cbn07XG4iLCJ3aW5kb3cuZGF0YSA9IHdpbmRvdy5kYXRhIHx8IHt9O1xuXG5tb2R1bGUuZXhwb3J0cy5mZXRjaEFsbCA9IGZ1bmN0aW9uICgpIHtcblxuICAkLmdldCgnL2RhdGEvcHJvamVjdHMuanNvbicpLnRoZW4oZnVuY3Rpb24gKGRhdGEpIHtcblxuICAgIHdpbmRvdy5tYXAuZmlyZUV2ZW50KCdkYXRhUmVjZWl2ZWQnLCB7ZGF0YVR5cGU6ICdwcm9qZWN0cycsIGRhdGE6IGRhdGEucHJvamVjdHN9KTtcblxuICB9LCBmdW5jdGlvbiAoZXJyKSB7XG5cbiAgICBhbGVydCgnQ291bGQgbm90IGZldGNoIHByb2plY3RzIEpTT04uJyk7XG5cbiAgfSk7XG5cbn07XG4iLCJtb2R1bGUuZXhwb3J0cy5wcm9qZWN0Q291bnRUb0NvbG91ciA9IGZ1bmN0aW9uIChkKSB7XG4gIHJldHVybiBkID4gNTAgPyAnIzgwMDAyNicgOlxuICBkID4gNDAgID8gJyNGQzRFMkEnIDpcbiAgZCA+IDMwICAgPyAnI0ZEOEQzQycgOlxuICBkID4gMjAgICA/ICcjRkVCMjRDJyA6XG4gIGQgPiAxMCAgID8gJyNGRUQ5NzYnIDpcbiAgJyNGRkVEQTAnO1xufTtcblxuIl19
