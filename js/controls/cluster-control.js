var isClusteringEnabled = false;

module.exports = L.easyButton('fa-map-marker', function(btn, map) {

  if (isClusteringEnabled) {
    window.map.fireEvent('hideLayer', {layer: 'clusters'});
    window.map.fireEvent('showLayer', {layer: 'markers'});
  } else {
    window.map.fireEvent('hideLayer', {layer: 'markers'});
    window.map.fireEvent('showLayer', {layer: 'clusters'});
  }

  isClusteringEnabled = !isClusteringEnabled;

});

