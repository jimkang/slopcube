var curry = require('lodash.curry');
var renderPoints = require('./render-points');
var renderLines = require('./render-lines');
var {
  getLinearGradientObject,
  getLinearGradientId
} = require('../linear-gradient');
var renderLinearGradientDefs = require('../dom/render-linear-gradient-defs');

import { Layout } from '../types';

function renderShiftingLayouts({
  layouts,
  probable
}: {
  layouts: Array<Layout>;
  probable: object;
}) {
  // timer todo
  layouts.forEach(curry(renderLayout)(probable));
}

function renderLayout(probable, { hexagonVertices, cubeLines, contourLines }) {
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
    center: hexagonVertices.center,
    colorAccessor: getColor
  });
  renderLines({
    lines: cubeLines.cyclicLines,
    className: 'cyclic-edge',
    rootSelector: '#edge-layer .cube-edges',
    center: hexagonVertices.center,
    colorAccessor: getColor
  });
  renderLines({
    lines: contourLines,
    className: 'contour-edge',
    rootSelector: '#edge-layer .contour-edges',
    probable,
    center: hexagonVertices.center,
    colorAccessor: getColor
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
