import { LinearGradient, Spot, HCLColor } from './types';
var hclColorToD3 = require('./hcl-color-to-d3');
var interpolateHCL = require('./interpolate-hcl');

var allDotsRegex = /\./g;

const animHueShift = 40;

function getLinearGradientObject({
  ptA,
  ptB
}: {
  ptA: Spot;
  ptB: Spot;
}): LinearGradient {
  const aIsGreaterHorizontally = ptA.pt[0] > ptB.pt[0];
  const aIsGreaterVertically = ptA.pt[1] > ptB.pt[1];

  return {
    id: getLinearGradientId({ ptA, ptB }),
    x1: aIsGreaterHorizontally ? '100%' : '0%',
    x2: aIsGreaterHorizontally ? '0%' : '100%',
    y1: aIsGreaterVertically ? '100%' : '0%',
    y2: aIsGreaterVertically ? '0%' : '100%',
    beginColor: ptA.color,
    endColor: ptB.color,
    beginColorAnimValues: getAnimationValuesforColor(ptA.color),
    endColorAnimValues: getAnimationValuesforColor(ptB.color)
  };
}

function getLinearGradientId({ ptA, ptB }: { ptA: Spot; ptB: Spot }) {
  return `lg_${ptA.color.h}_${ptA.color.c}_${ptA.color.l}_to_${ptB.color.h}_${ptB.color.c}_${ptB.color.l}`.replace(
    allDotsRegex,
    'dot'
  );
}

function hclColorToRGBString(color: HCLColor) {
  var hclColor = hclColorToD3(color);
  return hclColor.formatRgb(); // formatHsl gives you negative percentages sometimes?!
}

function getAnimationValuesforColor(color: HCLColor) {
  var redder: HCLColor = {
    h: (color.h - animHueShift) % 360,
    c: color.c,
    l: color.l,
    opacity: color.opacity
  };
  var slightlyRedder: HCLColor = interpolateHCL(color, redder)(0.5);
  var bluer: HCLColor = {
    h: (color.h + animHueShift) % 360,
    c: color.c,
    l: color.l,
    opacity: color.opacity
  };
  var slightlyBluer: HCLColor = interpolateHCL(color, bluer)(0.5);

  return [
    color,
    slightlyBluer,
    bluer,
    slightlyBluer,
    color,
    slightlyRedder,
    redder,
    slightlyRedder,
    color
  ]
    .map(hclColorToRGBString)
    .join(';');
}

module.exports = {
  getLinearGradientObject,
  hclColorToRGBString,
  getLinearGradientId
};
