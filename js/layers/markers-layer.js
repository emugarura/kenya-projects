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

