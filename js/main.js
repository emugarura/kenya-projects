var MAP_CENTER = [0.5, 39];
var MAP_ZOOM = 6;

var projects = [];

var map;
var layers = {
  'markers': L.layerGroup(),
  'clusters': L.markerClusterGroup({showCoverageOnHover: false, zoomToBoundsOnClick: true})
};

var controls = {};
var options = {isClusteringEnabled: false};

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

var getColor = function (d) {
  return d > 50 ? '#800026' :
  d > 40  ? '#FC4E2A' :
  d > 30   ? '#FD8D3C' :
  d > 20   ? '#FEB24C' :
  d > 10   ? '#FED976' :
  '#FFEDA0';
};

var drawControls = function () {

  controls.info = L.control({position: 'topright'});

  controls.info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info project-info');
    this.update();
    return this._div;
  };

  controls.info.update = function (project) {
    this._div.innerHTML =  (project ?
      '<h4>' + (project.title ? project.title : 'Untitled Project in ' + project.county) + '</h4>' +
      (project.description ? '<p>' + project.description + '</p>' : '<p>No Description</p>') +
      (project.objectives ? '<h5>Objectives</h5><p>' + project.objectives + '</p>' : '') 
    : '<h4>Donor and Government Funded Projects in Kenya</h4>');
  };

  controls.info.addTo(map);


  controls.legend = L.control({position: 'bottomright'});

  controls.legend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'info legend'),
    grades = [0, 10, 20, 30, 40, 50],
    labels = [],
    from, to;

    for (var i = 0; i < grades.length; i++) {
      from = grades[i];
      to = grades[i + 1];

      labels.push(
        '<i style="background:' + getColor(from + 1) + '"></i> ' +
          from + (to ? '&ndash;' + to : '+'));
    }

    div.innerHTML = '<h4>Legend</h4><h5>Projects per County</h5>' + labels.join('<br>');
    return div;
  };

  controls.legend.addTo(map);

  L.easyButton('fa-map-marker', function(btn, map){
    if (options.isClusteringEnabled) {
      drawMarkers();
    } else {
      drawClusters();
    }
    options.isClusteringEnabled = !options.isClusteringEnabled;
  }).addTo(map);
};

var fetchProjects = function (cb) {

  var mkHoverFunction = function (project) {
    return function () {
      controls.info.update(project);
    };
  };

  $.get('/data/projects.json').then(function (data) {
    projects = data.projects;

    for (var i=0; i<projects.length; i++) {
      if (projects[i].lng && projects[i].lat) {
        projects[i].marker = L.marker([projects[i].lat, projects[i].lng]);
        projects[i].marker.on('mouseover', mkHoverFunction(projects[i]));
        projects[i].marker.on('mouseout', function () { controls.info.update.bind(controls.info)(); });
      }
    }

    cb(projects);
  }, function (err) {
    alert('Could not load projects JSON.'); // TODO fixme
  });

};

var drawMarkers = function () {
  layers.clusters.clearLayers();
  layers.markers.clearLayers();

  for (var i=0; i<projects.length; i++) {
    if (projects[i].marker) {

      layers.markers.addLayer(projects[i].marker);
    }
  }
};

var drawClusters = function () {
  layers.markers.clearLayers();
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
      fillColor: getColor(getProjectCountForCounty(feature.properties.COUNTY_NAM)),
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


  layers.counties = L.geoJson(countiesData, {
    style: style,
    onEachFeature: onEachFeature
  });

  layers.counties.addTo(map);

};


$(function () {

  initMap();
  drawControls();
  
  fetchProjects(function () {
    drawMarkers();
    fetchCounties(drawCounties);
  });

});
