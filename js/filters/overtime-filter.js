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

