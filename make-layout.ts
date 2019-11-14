var flatten = require('lodash.flatten');
var math = require('basic-2d-math');
var interpolateHCL = require('./interpolate-hcl');

import { Spot, Line, copyPt, Layout, Hexagon } from './types';

function makeLayout({
  hexagon,
  contourIndexesOnEachParallelTrio,
  contourDivisionsPerLine
}: {
  hexagon: Hexagon;
  contourIndexesOnEachParallelTrio: Array<Array<number>>;
  contourDivisionsPerLine: number;
}): Layout {
  var cubeLines = getCubeLines(hexagon);
  var radialLine0ContourLines = getContourLines({
    edgeTrio: [
      cubeLines.cyclicLines[2],
      cubeLines.radialLines[0],
      cubeLines.cyclicLines[5]
    ],
    contourIndexesForTrio: contourIndexesOnEachParallelTrio[0]
  });
  var radialLine2ContourLines = getContourLines({
    edgeTrio: [
      cubeLines.cyclicLines[1],
      cubeLines.radialLines[1],
      cubeLines.cyclicLines[4]
    ],
    contourIndexesForTrio: contourIndexesOnEachParallelTrio[1]
  });
  var radialLine4ContourLines = getContourLines({
    edgeTrio: [
      cubeLines.cyclicLines[0],
      cubeLines.radialLines[2],
      cubeLines.cyclicLines[3]
    ],
    contourIndexesForTrio: contourIndexesOnEachParallelTrio[2]
  });
  var contourLines = flatten(
    radialLine0ContourLines
      .concat(radialLine2ContourLines)
      .concat(radialLine4ContourLines)
  );
  return { hexagon, cubeLines, contourLines };

  function getContourLines({
    edgeTrio,
    contourIndexesForTrio
  }: {
    edgeTrio: [Line, Line, Line];
    contourIndexesForTrio: Array<number>;
  }) {
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

    function getContourPointsAlongLine(line: Line, i: number) {
      var { coords, ptA, ptB } = line;
      var pts: Array<Spot> = [];
      const yDelta = coords[1][1] - coords[0][1];
      const xDelta = coords[1][0] - coords[0][0];
      for (var i = 0; i < contourIndexesForTrio.length; ++i) {
        const contourIndex = contourIndexesForTrio[i];
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
module.exports = makeLayout;
