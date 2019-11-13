var d3 = require('d3-selection');
var accessor = require('accessor');
var { parseHCLColorToRGBString } = require('../linear-gradient');
var interpolateHCL = require('../interpolate-hcl');

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
    .classed('middle-stop', true)
    .attr('offset', '50%')
    .append('animate')
    .attr('attributeName', 'offset')
    .attr('values', '.95;.80;.60;.40;.20;0;.20;.40;.60;.80;.95')
    .attr('dur', '2.5s')
    .attr('repeatCount', 'indefinite');
  newGradientDefs
    .append('stop')
    .classed('end-stop', true)
    .attr('offset', '100%');

  var activeGradientDefs = newGradientDefs.merge(gradientDefs);
  activeGradientDefs
    .attr('id', accessor())
    .attr('x1', accessor('x1'))
    .attr('x2', accessor('x2'))
    .attr('y1', accessor('y1'))
    .attr('y2', accessor('y2'));
  activeGradientDefs.select('.begin-stop').attr('stop-color', getBeginColor);
  activeGradientDefs.select('.middle-stop').attr('stop-color', getMiddleColor);
  activeGradientDefs.select('.end-stop').attr('stop-color', getEndColor);
}

function getBeginColor({ beginColor }) {
  return parseHCLColorToRGBString(beginColor);
}

function getEndColor({ endColor }) {
  return parseHCLColorToRGBString(endColor);
}

function getMiddleColor({ beginColor, endColor }) {
  return parseHCLColorToRGBString(interpolateHCL(beginColor, endColor)(0.5));
}

module.exports = renderLinearGradientDefs;
