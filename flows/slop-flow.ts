var { range } = require('d3-array');
var renderPoints = require('../dom/render-points');
var renderLines = require('../dom/render-edges');
var math = require('basic-2d-math');
var { Tablenest, d } = require('tablenest');
var Probable = require('probable').createProbable;
var {
  getLinearGradientObject,
  getLinearGradientId
} = require('../linear-gradient');
var renderLinearGradientDefs = require('../dom/render-linear-gradient-defs');
var flatten = require('lodash.flatten');
var interpolateHCL = require('../interpolate-hcl');
var { hsl } = require('d3-color');

import { HCLColor, Spot, Line, copyPt } from '../types';

const baseSliceAngle = (2 * Math.PI) / 6;
const baseRadialLineLength = 25;

var divisionsTableDef = {
  root: [[10, d`d2+3`], [3, d`d20+5`], [2, d`d100+20`], [1, d`d200+100`]]
};

function slopFlow({ random }) {
  var probable = Probable({ random });
  var tablenest = Tablenest({ random });

  var rollDivisions = tablenest(divisionsTableDef);
  let contourDivisionsPerLine = rollDivisions();
  console.log('contourDivisionsPerLine', contourDivisionsPerLine);

  var hexagonVertices = getHexagon();

  renderPoints({
    points: hexagonVertices.edgeVertices.map(v => v.pt),
    className: 'hexagon-vertex',
    rootSelector: '#debug-layer .hexagon-points',
    colorAccessor: v => v.color
  });
  renderPoints({
    points: [hexagonVertices.center.pt],
    className: 'hexagon-center',
    rootSelector: '#debug-layer .hexagon-points',
    colorAccessor: hexagonVertices.center.color
  });

  var cubeLines = getCubeLines(hexagonVertices);

  var radialLine0ContourLines = getContourLines([
    cubeLines.cyclicLines[2],
    cubeLines.radialLines[0],
    cubeLines.cyclicLines[5]
  ]);
  var radialLine2ContourLines = getContourLines([
    cubeLines.cyclicLines[1],
    cubeLines.radialLines[1],
    cubeLines.cyclicLines[4]
  ]);
  var radialLine4ContourLines = getContourLines([
    cubeLines.cyclicLines[0],
    cubeLines.radialLines[2],
    cubeLines.cyclicLines[3]
  ]);
  var contourLines = flatten(
    radialLine0ContourLines
      .concat(radialLine2ContourLines)
      .concat(radialLine4ContourLines)
  );

  var activeLinearGradients = cubeLines.radialLines
    .concat(cubeLines.cyclicLines)
    .concat(contourLines)
    .map(getLinearGradientObject)
    .reduce(lgObjectIsUnique, []);

  // The linear gradient defs referenced by the edges
  // must exist before they are referenced.
  renderLinearGradientDefs(activeLinearGradients);

  renderLines({
    edges: cubeLines.radialLines,
    className: 'radial-edge',
    rootSelector: '#edge-layer .cube-edges',
    center: hexagonVertices.center,
    colorAccessor: getColor
  });
  renderLines({
    edges: cubeLines.cyclicLines,
    className: 'cyclic-edge',
    rootSelector: '#edge-layer .cube-edges',
    center: hexagonVertices.center,
    colorAccessor: getColor
  });
  renderLines({
    edges: contourLines,
    className: 'contour-edge',
    rootSelector: '#edge-layer .contour-edges',
    probable,
    center: hexagonVertices.center,
    colorAccessor: getColor
  });

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
    return getVariantValue(baseSliceAngle, [-0.5, 0.5]);
  }

  function getRadialLineLength() {
    return getVariantValue(baseRadialLineLength, [-0.5, 0.5]);
  }

  function getVariantValue(base, proportionRange) {
    const proportionalVariance =
      proportionRange[0] +
      (probable.roll(100) / 100) * (proportionRange[1] - proportionRange[0]);
    return base + base * proportionalVariance;
  }

  function getContourLines(edgeTrio: [Line, Line, Line]) {
    const contourPtsPerLine = probable.roll(contourDivisionsPerLine - 1) + 1;

    // We need to make the edges go in the same direction.
    var centerLine = edgeTrio[1];
    var edgeDirection = getLineDirection(centerLine);
    var firstLine = edgeTrio[0];
    var lastLine = edgeTrio[2];
    firstLine = matchDirection({
      direction: edgeDirection,
      edge: firstLine
    });
    lastLine = matchDirection({
      direction: edgeDirection,
      edge: lastLine
    });

    var contourPointsGroups: Array<Array<Spot>> = edgeTrio.map(
      getContourPointsAlongLine
    );
    return [
      makeLinesBetweenPointGroups({
        ptGroupA: contourPointsGroups[0],
        ptGroupB: contourPointsGroups[1],
        edgeIds: [firstLine.id, centerLine.id]
      }),
      makeLinesBetweenPointGroups({
        ptGroupA: contourPointsGroups[1],
        ptGroupB: contourPointsGroups[2],
        edgeIds: [centerLine.id, lastLine.id]
      })
    ];

    function getContourPointsAlongLine(line: Line) {
      var { coords, ptA, ptB } = line;
      var pts: Array<Spot> = [];
      var contourIndexes = probable
        .sample(range(contourDivisionsPerLine), contourPtsPerLine)
        .sort();
      const yDelta = coords[1][1] - coords[0][1];
      const xDelta = coords[1][0] - coords[0][0];
      for (var i = 0; i < contourIndexes.length; ++i) {
        const contourIndex = contourIndexes[i];
        const coordsProportion = contourIndex / contourDivisionsPerLine;
        const ptX = coords[0][0] + xDelta * coordsProportion;
        const ptY = coords[0][1] + yDelta * coordsProportion;
        pts.push({
          contourIndex,
          pt: [ptX, ptY],
          color: getColorBetweenPoints({
            proportion: coordsProportion,
            ptA,
            ptB
          })
        });
      }
      return pts;
    }

    function makeLinesBetweenPointGroups({
      ptGroupA,
      ptGroupB,
      edgeIds
    }: {
      ptGroupA: Array<Spot>;
      ptGroupB: Array<Spot>;
      edgeIds: [string, string];
    }) {
      if (ptGroupA.length !== ptGroupB.length) {
        throw new Error(
          `makeLinesBetweenPointGroups was given point groups of different sizes: ${ptGroupA.length} and ${ptGroupB.length}.`
        );
      }
      var edges: Array<Line> = [];

      for (var i = 0; i < ptGroupA.length; ++i) {
        const idBase = `contour-SRC-${edgeIds[0]}-DEST-${edgeIds[1]}`;
        let ptA: Spot = ptGroupA[i];
        let ptB: Spot = ptGroupB[i];
        edges.push({
          id: `${idBase}-indexes-${ptA.contourIndex}-${ptB.contourIndex}`,
          coords: [copyPt(ptA.pt), copyPt(ptB.pt)],
          ptA,
          ptB
        });
      }

      return edges;
    }
  }

  function getCubeLines({ center, edgeVertices }) {
    var radialLines: Array<Line> = [];
    for (var i = 0; i < edgeVertices.length; i += 2) {
      radialLines.push({
        id: `radial-edge-${i}`,
        coords: [center.pt.slice(), edgeVertices[i].pt.slice()],
        ptA: center,
        ptB: edgeVertices[i]
      });
    }
    var cyclicLines = edgeVertices.map(makeLineToPrev);
    return { radialLines, cyclicLines };
  }

  function makeLineToPrev(point, i, points): Line {
    var prevIndex;
    if (i === 0) {
      prevIndex = points.length - 1;
    } else {
      prevIndex = i - 1;
    }
    var prev = points[prevIndex];
    return {
      id: `cyclic-edge-${prevIndex}-to-${i}`,
      coords: [prev.pt.slice(), point.pt.slice()],
      ptA: prev,
      ptB: point
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

  // TODO: Make this a mode
  function getColor({ id, edge, ptA, ptB }) {
    //return `hsl(${ptA.color.h}, ${ptA.color.s}%, ${ptA.color.l}%)`;
    return `url('#${getLinearGradientId({ ptA, ptB })}')`;
  }

  // TODO: Some kinda scheme.
  function getRandomColor(): HCLColor {
    return {
      h: probable.roll(360),
      c: probable.roll(100),
      l: probable.roll(80) + 20,
      opacity: 1.0
    };
  }
}

function getComplementOfSliceAngle(angle) {
  const variance = angle - baseSliceAngle;
  return baseSliceAngle - variance;
}

function getLineDirection(line: Line): [number, number] {
  return [line.ptB[0] - line.ptA[0], line.ptB[1] - line.ptA[1]];
}

function matchDirection({
  direction,
  edge
}: {
  direction: [number, number];
  edge: Line;
}): Line {
  var edgeDirection = getLineDirection(edge);
  var reverseDirection = edgeDirection.map(invert);
  var normalCosSim = math.cosSim(edgeDirection, direction);
  var revCosSim = math.cosSim(reverseDirection, direction);
  if (normalCosSim < revCosSim) {
    edge.coords = [edge.coords[1], edge.coords[0]];
  }
  return edge;
}

function invert(x) {
  return x * -1;
}

function getColorBetweenPoints({
  ptA,
  ptB,
  proportion
}: {
  ptA: Spot;
  ptB: Spot;
  proportion: number;
}) {
  var color = interpolateHCL(ptA.color, ptB.color)(proportion);
  return color;
}

function lgObjectIsUnique(collected, lg) {
  if (!collected.find(matchesId)) {
    collected.push(lg);
  }
  return collected;

  function matchesId(collectedLg) {
    return collectedLg.id === lg.id;
  }
}

module.exports = slopFlow;
