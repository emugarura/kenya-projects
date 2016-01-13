module.exports.projectCountToColour = function (d) {
  return d > 50 ? '#810f7c' :
  d > 40  ? '#8856a7' :
  d > 30   ? '#8c96c6' :
  d > 20   ? '#9ebcda' :
  d > 10   ? '#bfd3e6' :
  '#edf8fb';
};

