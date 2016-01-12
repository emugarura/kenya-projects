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

