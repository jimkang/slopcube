var d3 = require('d3-selection');
var accessor = require('accessor');
require('d3-transition');
var ease = require('d3-ease');

function RenderLines({ probable }) {
  return renderLines;

  function renderLines({
    lines,
    className,
    rootSelector,
    colorAccessor,
    tweenLengthMS = 1000,
    center
  }) {
    var linesRoot = d3.select(rootSelector);
    var linesSel = linesRoot.selectAll('.' + className).data(lines, accessor());
    var newLines = linesSel
      .enter()
      .append('line')
      .classed(className, true)
      // Start new lines on old lines.
      .each(setPositionToCloseExistingLine);

    // Very important to not do this until the new lines have found an
    // initial position.
    linesSel.exit().remove();

    var updateLines = newLines.merge(linesSel);
    updateLines
      .attr('id', accessor())
      .transition()
      .duration(tweenLengthMS)
      .ease(ease.easeLinear)
      .attr('x1', getLineSrcX)
      .attr('y1', getLineSrcY)
      .attr('x2', getLineDestX)
      .attr('y2', getLineDestY);

    if (colorAccessor) {
      updateLines.attr('stroke', colorAccessor);
    }

    function setPositionToCloseExistingLine({ id }) {
      var copyLineSel = d3.select(this);
      var parts = id.split('-');
      var prefix = parts.slice(0, -2).join('-');
      var existingLines = d3.selectAll(`[id^="${prefix}"]`).data();
      if (existingLines.length < 1) {
        //console.log('No near edge for prefix', prefix, 'center', center);
        copyLineSel
          .attr('x1', center.pt[0])
          .attr('y1', center.pt[1])
          .attr('x2', center.pt[0])
          .attr('y2', center.pt[1]);
        return;
      }

      // TODO: Maybe find actual nearest edge?
      var templateLine = probable.pick(existingLines);
      copyLineSel
        .attr('x1', getLineSrcX(templateLine))
        .attr('y1', getLineSrcY(templateLine))
        .attr('x2', getLineDestX(templateLine))
        .attr('y2', getLineDestY(templateLine));
    }
  }
}

function getLineSrcX({ coords }) {
  return coords[0][0];
}

function getLineSrcY({ coords }) {
  return coords[0][1];
}

function getLineDestX({ coords }) {
  return coords[1][0];
}

function getLineDestY({ coords }) {
  return coords[1][1];
}

module.exports = RenderLines;
