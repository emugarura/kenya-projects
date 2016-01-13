# kenya-projects

An interactive map showing data on donor and government funded projects in Kenya.

This software plots each government project on a map of Kenya. Features:

* Display of project location, name, description and objectives.
* The ability to cluster projects on the map for better viewing.
* Filter for projects that are overdue.
* Map layer showing a choropleth of number of projects per county in Kenya.
* Map layer showing a choropleth of avg. cost of project per county.

## Motivations

The project was developed in order to maximize reuse of existing libraries.
This will help to reduce work load and to minimize bugs in the code.

The browserify library was employed to allow for modularization of the code,
ensuring each module was self contained and to increase overall maintainability
of the code.

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
where projects are most overdue. This would be useful for examining patterns in
project overruns and to determine where effort should be applied to prevent
project mismanagement in certain areas.

Some effort was made into developing the project with the `EmberJS` framework.
This was intended to ensure any future scaling of the project would be made
easier. Also, ember's data binding layer would allow for easier data inspection and
manipulation. A prototype was developed using the `ember-leaflet` library,
allowing for a declarative approach to rendering the map. However, it was
decided that this approach would be 'overkill' for a small project like this
and the prototype was shelved.

* http://emberjs.com/
* https://github.com/miguelcobain/ember-leaflet

## References

Help and code samples taken from the following:

* http://leafletjs.com/examples/choropleth.html
* https://cartodb.com/basemaps/
* http://gis.stackexchange.com/questions/98003/leaflet-custom-control-fails
* http://colorbrewer2.org/

