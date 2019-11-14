var d3 = require('d3-selection');
var accessor = require('accessor');
var { hclColorToRGBString } = require('../linear-gradient');
var interpolateHCL = require('../interpolate-hcl');
var hclColorToD3 = require('../hcl-color-to-d3');

const endPointColorShiftDuration = '15s';

var defs = d3.select('defs');
const cubicEaseValues =
  '0.00;0.00;0.00;0.01;0.03;0.06;0.11;0.17;0.26;0.36;0.50;0.64;0.74;0.83;0.89;0.94;0.97;0.99;1.00;1.00;1.00;1.00;0.99;0.97;0.94;0.89;0.83;0.74;0.64;0.50;0.36;0.26;0.17;0.11;0.06;0.03;0.01';

function renderLinearGradientDefs(defObjects) {
  var gradientDefs = defs
    .selectAll('linearGradient')
    .data(defObjects, accessor());
  gradientDefs.exit().remove();
  var newGradientDefs = gradientDefs.enter().append('linearGradient');
  newGradientDefs
    .append('stop')
    .classed('begin-stop', true)
    .attr('offset', '0%')
    .append('animate')
    .attr('attributeName', 'stop-color')
    .attr('dur', endPointColorShiftDuration)
    .attr('repeatCount', 'indefinite');
  newGradientDefs
    .append('stop')
    .classed('middle-stop', true)
    .attr('offset', '50%')
    .append('animate')
    .attr('attributeName', 'offset')
    .attr('values', cubicEaseValues)
    .attr('dur', '15s')
    .attr('repeatCount', 'indefinite');
  newGradientDefs
    .append('stop')
    .classed('end-stop', true)
    .attr('offset', '100%')
    .append('animate')
    .attr('attributeName', 'stop-color')
    .attr('dur', endPointColorShiftDuration)
    .attr('repeatCount', 'indefinite');

  var activeGradientDefs = newGradientDefs.merge(gradientDefs);
  activeGradientDefs
    .attr('id', accessor())
    .attr('x1', accessor('x1'))
    .attr('x2', accessor('x2'))
    .attr('y1', accessor('y1'))
    .attr('y2', accessor('y2'));
  activeGradientDefs
    .select('.begin-stop')
    .attr('stop-color', getBeginColor)
    .select('animate')
    .attr('values', accessor('beginColorAnimValues'));
  activeGradientDefs.select('.middle-stop').attr('stop-color', getMiddleColor);
  activeGradientDefs
    .select('.end-stop')
    .attr('stop-color', getEndColor)
    .select('animate')
    .attr('values', accessor('endColorAnimValues'));
}

function getBeginColor({ beginColor }) {
  return hclColorToRGBString(beginColor);
}

function getEndColor({ endColor }) {
  return hclColorToRGBString(endColor);
}

// TODO: Sometimes the middle should just be black!
function getMiddleColor({ beginColor, endColor }) {
  return hclColorToRGBString(
    hclColorToD3(interpolateHCL(beginColor, endColor)(0.5)).brighter(1.0)
  );
}

module.exports = renderLinearGradientDefs;
