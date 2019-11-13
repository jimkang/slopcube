import { Spot, HCLColor } from './types';
var { formatHsl, hcl } = require('d3-color');

var allDotsRegex = /\./g;

function getLinearGradientObject({ ptA, ptB }: { ptA: Spot; ptB: Spot }) {
  return {
    id: getLinearGradientId({ ptA, ptB }),
    begin: ptA.color,
    end: ptB.color
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
