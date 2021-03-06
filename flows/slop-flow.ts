var { range } = require('d3-array');
var renderShiftingLayouts = require('../dom/render-shifting-layouts');
var { Tablenest, d } = require('tablenest');
var Probable = require('probable').createProbable;
var makeLayout = require('../make-layout');
var curry = require('lodash.curry');
var RenderLines = require('../dom/render-lines');
var GetSchemeColor = require('../get-scheme-color');

import { HCL, HCLColor, Spot, Line, copyPt, Layout, Hexagon } from '../types';

const baseSliceAngle = (2 * Math.PI) / 6;
const baseRadialLineLength = 30;
const spotWobbleFactor = 0.07;

var divisionsTableDef = {
  root: [[10, d`d3+2`], [3, d`d20+5`], [2, d`d100+20`], [1, d`d200+100`]]
};

function slopFlow({ random }) {
  var probable = Probable({ random });
  var tablenest = Tablenest({ random });
  var renderLines = RenderLines({ probable });

  var getSchemeColor = GetSchemeColor(probable);

  var rollDivisions = tablenest(divisionsTableDef);
  let contourDivisionsPerLine = rollDivisions();

  var hexagonA = getHexagon();

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

  const numberOfExtraLayouts = probable.rollDie(20);
  var layouts: Array<Layout> = [layoutA];

  for (var i = 0; i < numberOfExtraLayouts; ++i) {
    layouts.push(
      wobbleLayout({
        baseHexagon: hexagonA,
        contourIndexesOnEachParallelTrio,
        contourDivisionsPerLine
      })
    );
  }
  //console.log('layout count', layouts.length);

  renderShiftingLayouts({ layouts, renderLines });

  function getContourIndexesForTrio(numberOfContours: number): Array<number> {
    return probable
      .sample(range(contourDivisionsPerLine), numberOfContours)
      .sort();
  }

  function getHexagon() {
    var colorIndexes = probable.shuffle(range(7));
    var center: Spot = {
      pt: [50, 50],
      color: getSchemeColor(colorIndexes[6] / 7)
    };
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
        color: getSchemeColor(colorIndexes[i] / 7)
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

  function wobbleLayout({
    baseHexagon,
    contourIndexesOnEachParallelTrio,
    contourDivisionsPerLine
  }: {
    baseHexagon: Hexagon;
    contourIndexesOnEachParallelTrio: Array<Array<number>>;
    contourDivisionsPerLine: number;
  }) {
    var hexagonB = {
      center: baseHexagon.center,
      edgeVertices: baseHexagon.edgeVertices.map(wobbleSpot)
    };
    return makeLayout({
      hexagon: hexagonB,
      contourIndexesOnEachParallelTrio,
      contourDivisionsPerLine
    });
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
}

function getComplementOfSliceAngle(angle) {
  const variance = angle - baseSliceAngle;
  return baseSliceAngle - variance;
}

module.exports = slopFlow;
