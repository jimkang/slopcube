import { LinearGradient, Spot, HCLColor } from './types';
var { formatHsl, hcl } = require('d3-color');

var allDotsRegex = /\./g;

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
    endColor: ptB.color
  };
}

function getLinearGradientId({ ptA, ptB }: { ptA: Spot; ptB: Spot }) {
  return `lg_${ptA.color.h}_${ptA.color.c}_${ptA.color.l}_to_${ptB.color.h}_${ptB.color.c}_${ptB.color.l}`.replace(
    allDotsRegex,
    'dot'
  );
}

function parseHCLColorToRGBString(color: HCLColor) {
  var hclColor = hcl(color.h, color.c, color.l, color.opacity);
  return hclColor.formatRgb(); // formatHsl gives you negative percentages sometimes?!
}

module.exports = {
  getLinearGradientObject,
  parseHCLColorToRGBString,
  getLinearGradientId
};
