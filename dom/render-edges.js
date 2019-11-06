var d3 = require('d3-selection');
var accessor = require('accessor');

function renderEdges({ edges, className, rootSelector, colorAccessor }) {
  var edgesRoot = d3.select(rootSelector);
  var edgesSel = edgesRoot.selectAll('.' + className).data(edges, accessor());
  edgesSel.exit().remove();
  var newEdges = edgesSel
    .enter()
    .append('line')
    .classed(className, true);

  var updateEdges = newEdges.merge(edgesSel);
  updateEdges
    .attr('id', accessor())
    .attr('x1', accessor({ path: 'edge/0/0' }))
    .attr('y1', accessor({ path: 'edge/0/1' }))
    .attr('x2', accessor({ path: 'edge/1/0' }))
    .attr('y2', accessor({ path: 'edge/1/1' }));

  if (colorAccessor) {
    updateEdges.attr('stroke', colorAccessor);
  }
}

module.exports = renderEdges;
