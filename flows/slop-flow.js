var { range } = require('d3-array');
var renderPoints = require('../dom/render-points');

const baseSliceAngle = (2 * Math.PI) / 6;
const baseRadialEdgeLength = 25;

function slopFlow({ probable, randomId }) {
  var darkBG = probable.roll(3) > 0;
  document.body.classList[darkBG ? 'add' : 'remove']('dark');
  document.body.classList[darkBG ? 'remove' : 'add']('light');

  var hexagonVertices = getHexagon();
  renderPoints({
    points: hexagonVertices.edgeVertices,
    className: 'hexagon-vertex',
    rootSelector: '#debug-layer .hexagon-points'
  });
  renderPoints({
    points: [hexagonVertices.center],
    className: 'hexagon-center',
    rootSelector: '#debug-layer .hexagon-points'
  });

  function getHexagon() {
    var center = [50, 50];
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
      edgeVertices.push([center[0] + x, center[1] + y]);
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
}

function getComplementOfSliceAngle(angle) {
  const variance = angle - baseSliceAngle;
  return baseSliceAngle - variance;
}

module.exports = slopFlow;
