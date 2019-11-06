var d3 = require('d3-selection');
var accessor = require('accessor');

function renderEdges({ edges, className, rootSelector, colorAccessor }) {
  var edgesRoot = d3.select(rootSelector);
  edgesRoot.selectAll('.' + className).remove();
  var edgeLines = edgesRoot
    .selectAll('.' + className)
    .data(edges)
    .enter()
    .append('line')
    .classed(className, true)
    .attr('x1', accessor({ path: '0/0' }))
    .attr('y1', accessor({ path: '0/1' }))
    .attr('x2', accessor({ path: '1/0' }))
    .attr('y2', accessor({ path: '1/1' }));
  if (colorAccessor) {
    edgeLines.attr('stroke', colorAccessor);
  }
}

module.exports = renderEdges;
