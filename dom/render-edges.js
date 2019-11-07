var d3 = require('d3-selection');
var accessor = require('accessor');
require('d3-transition');
var ease = require('d3-ease');

function renderEdges({
  edges,
  className,
  rootSelector,
  colorAccessor,
  tweenLengthMS = 1000,
  probable,
  center
}) {
  var edgesRoot = d3.select(rootSelector);
  var edgesSel = edgesRoot.selectAll('.' + className).data(edges, accessor());
  var newEdges = edgesSel
    .enter()
    .append('line')
    .classed(className, true)
    // Start new edges on old edges.
    .each(setPositionToCloseExistingEdge);

  // Very important to not do this until the new edges have found an
  // initial position.
  edgesSel.exit().remove();

  var updateEdges = newEdges.merge(edgesSel);
  updateEdges
    .attr('id', accessor())
    .transition()
    .duration(tweenLengthMS)
    .ease(ease.easeLinear)
    .attr('x1', getEdgeSrcX)
    .attr('y1', getEdgeSrcY)
    .attr('x2', getEdgeDestX)
    .attr('y2', getEdgeDestY);

  if (colorAccessor) {
    updateEdges.attr('stroke', colorAccessor);
  }

  function setPositionToCloseExistingEdge({ id }) {
    var copyEdgeSel = d3.select(this);
    var parts = id.split('-');
    var prefix = parts.slice(0, -2).join('-');
    var existingEdges = d3.selectAll(`[id^="${prefix}"]`).data();
    if (existingEdges.length < 1) {
      console.log('No near edge for prefix', prefix);
      copyEdgeSel
        .attr('x1', center[0])
        .attr('y1', center[1])
        .attr('x2', center[0])
        .attr('y2', center[1]);
      return;
    }

    // TODO: Maybe find actual nearest edge?
    var templateEdge = probable.pick(existingEdges);
    copyEdgeSel
      .attr('x1', getEdgeSrcX(templateEdge))
      .attr('y1', getEdgeSrcY(templateEdge))
      .attr('x2', getEdgeDestX(templateEdge))
      .attr('y2', getEdgeDestY(templateEdge));
  }
}

function getEdgeSrcX({ edge }) {
  return edge[0][0];
}

function getEdgeSrcY({ edge }) {
  return edge[0][1];
}

function getEdgeDestX({ edge }) {
  return edge[1][0];
}

function getEdgeDestY({ edge }) {
  return edge[1][1];
}

module.exports = renderEdges;
