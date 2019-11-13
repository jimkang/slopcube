var d3 = require('d3-selection');
var accessor = require('accessor');
var { parseHCLColorToRGBString } = require('../linear-gradient');

var defs = d3.select('defs');

function renderLinearGradientDefs(defObjects) {
  var gradientDefs = defs
    .selectAll('linearGradient')
    .data(defObjects, accessor());
  gradientDefs.exit().remove();
  var newGradientDefs = gradientDefs.enter().append('linearGradient');
  newGradientDefs
    .append('stop')
    .classed('begin-stop', true)
    .attr('offset', '0%');
  newGradientDefs
    .append('stop')
    .classed('end-stop', true)
    .attr('offset', '100%');

  var activeGradientDefs = newGradientDefs.merge(gradientDefs);
  activeGradientDefs.attr('id', accessor());
  activeGradientDefs.select('.begin-stop').attr('stop-color', getBeginColor);
  activeGradientDefs.select('.end-stop').attr('stop-color', getEndColor);
}

function getBeginColor({ begin }) {
  return parseHCLColorToRGBString(begin);
}

function getEndColor({ end }) {
  return parseHCLColorToRGBString(end);
}

module.exports = renderLinearGradientDefs;
