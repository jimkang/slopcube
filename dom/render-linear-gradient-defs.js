var d3 = require('d3-selection');
var accessor = require('accessor');
var { parseLinearGradientIdToHSLString } = require('../linear-gradient-id');

var defs = d3.select('defs');

function renderLinearGradientDefs(defIds) {
  var gradientDefs = defs
    .selectAll('linearGradient')
    .data(defIds, accessor('identity'));
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
  activeGradientDefs.attr('id', accessor('identity'));

  activeGradientDefs.select('.begin-stop').attr('stop-color', getBeginColor);

  activeGradientDefs.select('.end-stop').attr('stop-color', getEndColor);
}

function getBeginColor(id) {
  return parseLinearGradientIdToHSLString(id)[0];
}

function getEndColor(id) {
  return parseLinearGradientIdToHSLString(id)[1];
}

module.exports = renderLinearGradientDefs;
