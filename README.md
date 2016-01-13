# kenya-projects

An interactive map showing data on donor and government funded projects in Kenya.

This software plots each government project on a map of Kenya. Features:

* Display of project location, name, description and objectives.
* The ability to cluster projects on the map for better viewing.
* Filter for projects that are overdue.
* Map layer showing a choropleth of number of projects per county in Kenya.
* Map layer showing a choropleth of avg. cost of project per county.

## Libraries Used

* jQuery: http://jquery.com/
* Leaflet: Mapping Library: http://leafletjs.com/
* Leaflet plugins: leaflet-groupedlayercontrol, Leaflet.EasyButton,
  leaflet.markercluster
* moment: Date manipulation: http://momentjs.com/
* browserify: require modules in the browser: http://browserify.org/

## Data Processing

A script to process data is in `scripts/`

See also: `scripts/README.md`

## Installation

1. Install web components from npm (for the processing script) and bower (for
   the web map):

  * `npm install`
  * `bower install`

2. Compile javascript using browserify (install if necessary):
  
  * `npm install -g browserify`
  * `browserify js/main.js -o bundle.js`

3. The web app must be run from a http server (as it loads assets over AJAX):

  * `npm install http-server -g`
  * `http-server`

## Future Work

A novel way to visualize the data would be to implement a heat map showing
where projects are most overdue.

This would be useful for examining patterns in project overruns and to
determine where effort should be applied to prevent project mismanagement in
certain areas.

## References

Help and code samples taken from the following:

* http://leafletjs.com/examples/choropleth.html
* https://cartodb.com/basemaps/
* http://gis.stackexchange.com/questions/98003/leaflet-custom-control-fails
* http://colorbrewer2.org/

