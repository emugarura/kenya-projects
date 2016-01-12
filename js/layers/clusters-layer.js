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

