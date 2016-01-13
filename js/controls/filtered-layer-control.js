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

