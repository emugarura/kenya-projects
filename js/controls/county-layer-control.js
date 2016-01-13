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

