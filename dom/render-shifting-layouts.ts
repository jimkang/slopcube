var curry = require('lodash.curry');
var renderPoints = require('./render-points');
var {
  getLinearGradientObject,
  getLinearGradientId
} = require('../linear-gradient');
var renderLinearGradientDefs = require('../dom/render-linear-gradient-defs');
var Interval = require('d3-timer').interval;

var timer;

import { Layout } from '../types';

function renderShiftingLayouts({
  layouts,
  shiftPeriod = 2000,
  renderLines
}: {
  layouts: Array<Layout>;
  probable: object;
  shiftPeriod: number;
  renderLines: object;
}) {
  var layoutIndex = 0;

  if (timer) {
    timer.stop();
  }

  timer = Interval(renderNextLayout, shiftPeriod);

  function renderNextLayout() {
    renderLayout(renderLines, shiftPeriod, layouts[layoutIndex]);
    layoutIndex += 1;
    if (layoutIndex >= layouts.length) {
      layoutIndex = 0;
    }
  }
}

function renderLayout(
  renderLines,
  tweenLengthMS,
  { hexagon, cubeLines, contourLines }
) {
  renderPoints({
    points: hexagon.edgeVertices.map(v => v.pt),
    className: 'hexagon-vertex',
    rootSelector: '#debug-layer .hexagon-points',
    colorAccessor: v => v.color
  });
  renderPoints({
    points: [hexagon.center.pt],
    className: 'hexagon-center',
    rootSelector: '#debug-layer .hexagon-points',
    colorAccessor: hexagon.center.color
  });

  var activeLinearGradients = cubeLines.radialLines
    .concat(cubeLines.cyclicLines)
    .concat(contourLines)
    .map(getLinearGradientObject)
    .reduce(lgObjectIsUnique, []);

  // The linear gradient defs referenced by the edges
  // must exist before they are referenced.
  renderLinearGradientDefs(activeLinearGradients);

  renderLines({
    lines: cubeLines.radialLines,
    className: 'radial-edge',
    rootSelector: '#edge-layer .cube-edges',
    center: hexagon.center,
    colorAccessor: getColor,
    tweenLengthMS
  });
  renderLines({
    lines: cubeLines.cyclicLines,
    className: 'cyclic-edge',
    rootSelector: '#edge-layer .cube-edges',
    center: hexagon.center,
    colorAccessor: getColor,
    tweenLengthMS
  });
  renderLines({
    lines: contourLines,
    className: 'contour-edge',
    rootSelector: '#edge-layer .contour-edges',
    center: hexagon.center,
    colorAccessor: getColor,
    tweenLengthMS
  });
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

// TODO: Make this a mode
function getColor({ id, edge, ptA, ptB }) {
  //return `hsl(${ptA.color.h}, ${ptA.color.s}%, ${ptA.color.l}%)`;
  return `url('#${getLinearGradientId({ ptA, ptB })}')`;
}
module.exports = renderShiftingLayouts;
