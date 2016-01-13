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

