var MAP_CENTER = [-0.003333, 36.816667];
var MAP_ZOOM = 6;

var projects = [];

var map;
var layers = {
  'markers': L.layerGroup(),
  'clusters': L.markerClusterGroup({showCoverageOnHover: false})
};

var initMap =  function () {
  layers.tiles = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
  });

  map = L.map('map', {
    scrollWheelZoom: false,
    center: MAP_CENTER,
    zoom: MAP_ZOOM
  });

  map.addLayer(layers.tiles);
  map.addLayer(layers.markers);
  map.addLayer(layers.clusters);
};

var fetchProjects = function (cb) {

  $.get('/data/projects.json').then(function (data) {
    projects = data.projects;

    for (var i=0; i<projects.length; i++) {
      if (projects[i].lng && projects[i].lat) {
        projects[i].marker = L.marker([projects[i].lat, projects[i].lng]);
      }
    }

    cb(projects);
  }, function (err) {
    alert('Could not load projects JSON.'); // TODO fixme
  });

};

var drawMarkers = function () {
  layers.markers.clearLayers();

  for (var i=0; i<projects.length; i++) {
    if (projects[i].marker) {
      layers.markers.addLayer(projects[i].marker);
    }
  }
};

var drawClusters = function () {
  layers.clusters.clearLayers();

  for (var i=0; i<projects.length; i++) {
    if (projects[i].marker) {
      layers.clusters.addLayer(projects[i].marker);
    }
  }
};

var fetchCounties = function (cb) {
  $.get('/data/counties.json').then(function (data) {
    cb(data);
  }, function (err) {
    alert('Could not load counties JSON.'); // TODO fixme
  });
};

var drawCounties = function (countiesData) {

  L.geoJson(countiesData).addTo(map);

};


$(function () {

  initMap();
  fetchProjects(drawClusters);
  fetchCounties(drawCounties);

});
