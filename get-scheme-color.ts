var chromaticScales = require('d3-scale-chromatic');
var { hcl } = require('d3-color');
import { HCLColor, HCL } from './types';

var scaleTable = [
  //[1, 'interpolateBlues'],
  [1, 'interpolateBrBG'],
  [1, 'interpolateBuGn'],
  //[2, 'interpolateBuPu'],
  [1, 'interpolateCividis'],
  [2, 'interpolateCool'],
  [1, 'interpolateCubehelixDefault'],
  //[1, 'interpolateGnBu'],
  [1, 'interpolateGreens'],
  //[1, 'interpolateGreys'],
  [2, 'interpolateInferno'],
  [2, 'interpolateMagma'],
  //[1, 'interpolateOrRd'],
  [1, 'interpolateOranges'],
  [1, 'interpolatePRGn'],
  [1, 'interpolatePiYG'],
  [2, 'interpolatePlasma'],
  [1, 'interpolatePuBu'],
  //[1, 'interpolatePuBuGn'],
  //[1, 'interpolatePuOr'],
  [1, 'interpolatePuRd'],
  //[1, 'interpolatePurples'],
  [1, 'interpolateRainbow'],
  [1, 'interpolateRdBu'],
  //[1, 'interpolateRdGy'],
  [1, 'interpolateRdPu'],
  [1, 'interpolateRdYlBu'],
  [1, 'interpolateRdYlGn'],
  [1, 'interpolateReds'],
  [2, 'interpolateSinebow'],
  [1, 'interpolateSpectral'],
  [2, 'interpolateTurbo'],
  [2, 'interpolateViridis'],
  [2, 'interpolateWarm'],
  [1, 'interpolateYlGn'],
  [1, 'interpolateYlGnBu'],
  [1, 'interpolateYlOrBr'],
  [1, 'interpolateYlOrRd'],
  [0, 'random']
];

function GetSchemeColor(probable) {
  var scale = probable.createTableFromSizes(scaleTable).roll();
  console.log('scale', scale);
  if (scale === 'random') {
    return getRandomColor;
  } else {
    return getScaleColor;
  }

  function getRandomColor(): HCLColor {
    return HCL(
      probable.roll(360),
      probable.roll(100),
      probable.roll(70) + 30,
      1.0
    );
  }

  function getScaleColor(t) {
    var d3hcl = hcl(chromaticScales[scale](t));
    return HCL(d3hcl.h, d3hcl.c, d3hcl.l, d3hcl.opacity);
  }
}

module.exports = GetSchemeColor;
