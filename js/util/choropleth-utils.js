module.exports.projectCountToColour = function (d) {
  return d > 50 ? '#810f7c' :
  d > 40  ? '#8856a7' :
  d > 30   ? '#8c96c6' :
  d > 20   ? '#9ebcda' :
  d > 10   ? '#bfd3e6' :
  '#edf8fb';
};

module.exports.avgCostToColour = function (d) {
  return d > 2500000000 ? '#b30000' :
  d > 2000000000  ? '#e34a33' :
  d > 1500000000   ? '#fc8d59' :
  d > 1000000000   ? '#fdbb84' :
  d > 500000000   ? '#fdd49e' :
  '#fef0d9';
};

