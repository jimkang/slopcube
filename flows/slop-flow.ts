var { range } = require('d3-array');
var renderShiftingLayouts = require('../dom/render-shifting-layouts');
var { Tablenest, d } = require('tablenest');
var Probable = require('probable').createProbable;
var makeLayout = require('../make-layout');
var curry = require('lodash.curry');
var RenderLines = require('../dom/render-lines');

import { HCL, HCLColor, Spot, Line, copyPt, Layout } from '../types';

const baseSliceAngle = (2 * Math.PI) / 6;
const baseRadialLineLength = 35;
const spotWobbleFactor = 0.1;

var divisionsTableDef = {
  root: [[10, d`d3+2`], [3, d`d20+5`], [2, d`d100+20`], [1, d`d200+100`]]
};

function slopFlow({ random }) {
  var probable = Probable({ random });
  var tablenest = Tablenest({ random });
  var renderLines = RenderLines({ probable });

  var rollDivisions = tablenest(divisionsTableDef);
  let contourDivisionsPerLine = rollDivisions();

  var hexagonA = getHexagon();
  var hexagonB = {
    center: hexagonA.center,
    edgeVertices: hexagonA.edgeVertices.map(wobbleSpot)
  };
  console.log('hexagons', hexagonA, hexagonB);

  var numberOfContoursOnEachParallelTrio = range(3).map(
    () => probable.roll(contourDivisionsPerLine - 1) + 1
  );
  var contourIndexesOnEachParallelTrio: Array<
    Array<number>
  > = numberOfContoursOnEachParallelTrio.map(getContourIndexesForTrio);

  var layoutA: Layout = makeLayout({
    hexagon: hexagonA,
    contourIndexesOnEachParallelTrio,
    contourDivisionsPerLine
  });

  var layoutB: Layout = makeLayout({
    hexagon: hexagonB,
    contourIndexesOnEachParallelTrio,
    contourDivisionsPerLine
  });

  renderShiftingLayouts({ layouts: [layoutA, layoutB], renderLines });

  function getContourIndexesForTrio(numberOfContours: number): Array<number> {
    return probable
      .sample(range(contourDivisionsPerLine), numberOfContours)
      .sort();
  }

  function getHexagon() {
    var center: Spot = { pt: [50, 50], color: getRandomColor() };
    var edgeVertices: Array<Spot> = [];
    var sliceAngles = range(3).map(getSliceAngle);
    sliceAngles = sliceAngles.concat(
      sliceAngles.map(getComplementOfSliceAngle)
    );
    console.log('sliceAngles', sliceAngles);
    var radialLineLengths = range(6).map(getRadialLineLength);

    var angle = 0;
    for (var i = 0; i < 6; ++i) {
      angle += sliceAngles[i];
      const x = radialLineLengths[i] * Math.cos(angle);
      const y = radialLineLengths[i] * Math.sin(angle);
      edgeVertices.push({
        pt: [center.pt[0] + x, center.pt[1] + y],
        color: getRandomColor()
      });
    }
    return { center, edgeVertices };
  }

  function getSliceAngle() {
    return getVariantValue([-0.5, 0.5], baseSliceAngle);
  }

  function getRadialLineLength() {
    return getVariantValue([-0.5, 0.5], baseRadialLineLength);
  }

  function getVariantValue(proportionRange, base) {
    const proportionalVariance =
      proportionRange[0] +
      (probable.roll(100) / 100) * (proportionRange[1] - proportionRange[0]);
    return base + base * proportionalVariance;
  }

  function wobbleSpot(spot: Spot) {
    return {
      pt: spot.pt.map(
        curry(getVariantValue)([-spotWobbleFactor, spotWobbleFactor])
      ),
      color: spot.color,
      contourIndex: spot.contourIndex
    };
  }

  // Sort by distance from center.
  /*
  function comparePts(a, b) {
    const c = hexagonVertices.center;
    const aDistSq = Math.pow(a[0] - c[0], 2) + Math.pow(a[1] - c[1], 2);
    const bDistSq = Math.pow(b[0] - c[0], 2) + Math.pow(b[1] - c[1], 2);
    if (aDistSq < bDistSq) {
      return -1;
    }
    return 1;
  }
  */

  // TODO: Some kinda scheme.
  function getRandomColor(): HCLColor {
    return HCL(
      probable.roll(360),
      probable.roll(100),
      probable.roll(70) + 30,
      1.0
    );
  }
}

function getComplementOfSliceAngle(angle) {
  const variance = angle - baseSliceAngle;
  return baseSliceAngle - variance;
}

module.exports = slopFlow;
