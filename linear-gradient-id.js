var allDotsRegex = /\./g;
var allDotWordRegex = /dot/g;

// TODO: Maybe linear gradient objects instead?
function getLinearGradientId({ ptA, ptB }) {
  return `lg_${ptA.color.h}_${ptA.color.s}_${ptA.color.l}_to_${ptB.color.h}_${ptB.color.s}_${ptB.color.l}`.replace(
    allDotsRegex,
    'dot'
  );
}

function parseLinearGradientIdToHSLString(id) {
  return id
    .slice(3) // Cut off 'lg_'
    .split('_to_')
    .map(parseToHSL);
}

function parseToHSL(s) {
  var parts = s.split('_').map(putDotBack);
  return `hsl(${parts[0]}, ${parts[1]}%, ${parts[2]}%)`;
}

function putDotBack(s) {
  return s.replace(allDotWordRegex, '.');
}

module.exports = { getLinearGradientId, parseLinearGradientIdToHSLString };
