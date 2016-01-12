module.exports.projectCountToColour = function (d) {
  return d > 50 ? '#800026' :
  d > 40  ? '#FC4E2A' :
  d > 30   ? '#FD8D3C' :
  d > 20   ? '#FEB24C' :
  d > 10   ? '#FED976' :
  '#FFEDA0';
};

