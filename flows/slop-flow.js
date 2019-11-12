var { range } = require('d3-array');
var renderPoints = require('../dom/render-points');
var renderEdges = require('../dom/render-edges');
var math = require('basic-2d-math');
var { Tablenest, d } = require('tablenest');
var Probable = require('probable').createProbable;
var { getLinearGradientId } = require('../linear-gradient-id');
var renderLinearGradientDefs = require('../dom/render-linear-gradient-defs');
var uniq = require('lodash.uniq');

const baseSliceAngle = (2 * Math.PI) / 6;
const baseRadialEdgeLength = 25;

var divisionsTableDef = {
  root: [[10, d`d2+3`], [3, d`d20+5`], [2, d`d100+20`], [1, d`d200+100`]]
};

function slopFlow({ random }) {
  var probable = Probable({ random });
  var tablenest = Tablenest({ random });

  var rollDivisions = tablenest(divisionsTableDef);
  let contourDivisionsPerEdge = rollDivisions();
  console.log('contourDivisionsPerEdge', contourDivisionsPerEdge);

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

  var cubeEdges = getCubeEdges(hexagonVertices);

  var radialEdge0ContourEdges = getContourEdges([
    cubeEdges.cyclicEdges[2],
    cubeEdges.radialEdges[0],
    cubeEdges.cyclicEdges[5]
  ]);
  var radialEdge2ContourEdges = getContourEdges([
    cubeEdges.cyclicEdges[1],
    cubeEdges.radialEdges[1],
    cubeEdges.cyclicEdges[4]
  ]);
  var radialEdge4ContourEdges = getContourEdges([
    cubeEdges.cyclicEdges[0],
    cubeEdges.radialEdges[2],
    cubeEdges.cyclicEdges[3]
  ]);
  var contourEdges = radialEdge0ContourEdges
    .concat(radialEdge2ContourEdges)
    .concat(radialEdge4ContourEdges)
    .flat();

  var activeLinearGradientIds = uniq(
    cubeEdges.radialEdges
      .concat(cubeEdges.cyclicEdges)
      .concat(contourEdges)
      .map(getLinearGradientId)
  );

  // The linear gradient defs referenced by the edges
  // must exist before they are referenced.
  renderLinearGradientDefs(activeLinearGradientIds);

  renderEdges({
    edges: cubeEdges.radialEdges,
    className: 'radial-edge',
    rootSelector: '#edge-layer .cube-edges',
    center: hexagonVertices.center,
    colorAccessor: getColor
  });
  renderEdges({
    edges: cubeEdges.cyclicEdges,
    className: 'cyclic-edge',
    rootSelector: '#edge-layer .cube-edges',
    center: hexagonVertices.center,
    colorAccessor: getColor
  });
  renderEdges({
    edges: contourEdges,
    className: 'contour-edge',
    rootSelector: '#edge-layer .contour-edges',
    probable,
    center: hexagonVertices.center,
    colorAccessor: getColor
  });

  function getHexagon() {
    var center = { pt: [50, 50], color: getRandomColor() };
    var edgeVertices = [];
    var sliceAngles = range(3).map(getSliceAngle);
    sliceAngles = sliceAngles.concat(
      sliceAngles.map(getComplementOfSliceAngle)
    );
    console.log('sliceAngles', sliceAngles);
    var radialEdgeLengths = range(6).map(getRadialEdgeLength);

    var angle = 0;
    for (var i = 0; i < 6; ++i) {
      angle += sliceAngles[i];
      const x = radialEdgeLengths[i] * Math.cos(angle);
      const y = radialEdgeLengths[i] * Math.sin(angle);
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

  function getRadialEdgeLength() {
    return getVariantValue(baseRadialEdgeLength, [-0.5, 0.5]);
  }

  function getVariantValue(base, proportionRange) {
    const proportionalVariance =
      proportionRange[0] +
      (probable.roll(100) / 100) * (proportionRange[1] - proportionRange[0]);
    return base + base * proportionalVariance;
  }

  function getContourEdges(edgeTrio) {
    const contourPtsPerEdge = probable.roll(contourDivisionsPerEdge - 1) + 1;

    // We need to make the edges go in the same direction.
    var centerEdge = edgeTrio[1];
    var edgeDirection = getEdgeDirection(centerEdge.edge);
    var firstEdge = edgeTrio[0];
    var lastEdge = edgeTrio[2];
    firstEdge.edge = matchDirection({
      direction: edgeDirection,
      edge: firstEdge.edge
    });
    lastEdge.edge = matchDirection({
      direction: edgeDirection,
      edge: lastEdge.edge
    });

    var contourPointsGroups = edgeTrio.map(getContourPointsAlongEdge);
    return [
      makeEdgesBetweenPointGroups({
        pointGroups: [contourPointsGroups[0], contourPointsGroups[1]],
        edgeIds: [firstEdge.id, centerEdge.id]
      }),
      makeEdgesBetweenPointGroups({
        pointGroups: [contourPointsGroups[1], contourPointsGroups[2]],
        edgeIds: [centerEdge.id, lastEdge.id]
      })
    ];

    function getContourPointsAlongEdge({ edge, ptA, ptB }) {
      var pts = [];
      var contourIndexes = probable
        .sample(range(contourDivisionsPerEdge), contourPtsPerEdge)
        .sort();
      const yDelta = edge[1][1] - edge[0][1];
      const xDelta = edge[1][0] - edge[0][0];
      for (var i = 0; i < contourIndexes.length; ++i) {
        const contourIndex = contourIndexes[i];
        const edgeProportion = contourIndex / contourDivisionsPerEdge;
        const ptX = edge[0][0] + xDelta * edgeProportion;
        const ptY = edge[0][1] + yDelta * edgeProportion;
        pts.push({
          contourIndex,
          pt: [ptX, ptY],
          color: avgColors(ptA.color, ptB.color)
        });
      }
      return pts;
    }

    function makeEdgesBetweenPointGroups({ pointGroups, edgeIds }) {
      var [ptGroupA, ptGroupB] = pointGroups;
      if (ptGroupA.length !== ptGroupB.length) {
        throw new Error(
          `makeEdgesBetweenPointGroups was given point groups of different sizes: ${ptGroupA.length} and ${ptGroupB.length}.`
        );
      }
      var edges = [];

      for (var i = 0; i < ptGroupA.length; ++i) {
        const idBase = `contour-SRC-${edgeIds[0]}-DEST-${edgeIds[1]}`;
        let ptA = ptGroupA[i];
        let ptB = ptGroupB[i];
        edges.push({
          id: `${idBase}-indexes-${ptA.contourIndex}-${ptB.contourIndex}`,
          edge: [ptA.pt.slice(), ptB.pt.slice()],
          ptA,
          ptB
        });
      }

      return edges;
    }
  }

  function getCubeEdges({ center, edgeVertices }) {
    var radialEdges = [];
    for (var i = 0; i < edgeVertices.length; i += 2) {
      radialEdges.push({
        id: `radial-edge-${i}`,
        edge: [center.pt.slice(), edgeVertices[i].pt.slice()],
        ptA: center,
        ptB: edgeVertices[i]
      });
    }
    var cyclicEdges = edgeVertices.map(makeEdgeToPrev);
    return { radialEdges, cyclicEdges };
  }

  function makeEdgeToPrev(point, i, points) {
    var prevIndex;
    if (i === 0) {
      prevIndex = points.length - 1;
    } else {
      prevIndex = i - 1;
    }
    var prev = points[prevIndex];
    return {
      id: `cyclic-edge-${prevIndex}-to-${i}`,
      edge: [prev.pt.slice(), point.pt.slice()],
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
  function getRandomColor() {
    return {
      h: probable.roll(360),
      s: probable.roll(100),
      l: probable.roll(100)
    };
  }
}

function getComplementOfSliceAngle(angle) {
  const variance = angle - baseSliceAngle;
  return baseSliceAngle - variance;
}

function getEdgeDirection([ptA, ptB]) {
  return [ptB[0] - ptA[0], ptB[1] - ptA[1]];
}

function matchDirection({ direction, edge }) {
  var edgeDirection = getEdgeDirection(edge);
  var reverseDirection = edgeDirection.map(invert);
  var normalCosSim = math.cosSim(edgeDirection, direction);
  var revCosSim = math.cosSim(reverseDirection, direction);
  if (normalCosSim > revCosSim) {
    return edge;
  } else {
    return edge.reverse();
  }
}

function invert(x) {
  return x * -1;
}

// TODO: Weights
function avgColors(a, b) {
  return { h: (a.h + b.h) / 2, s: (a.s + b.s) / 2, l: (a.l + b.l) / 2 };
}

module.exports = slopFlow;
