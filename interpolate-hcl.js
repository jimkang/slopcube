// From https://github.com/d3/d3-interpolate

function constant(x) {
  return function() {
    return x;
  };
}

function linear(a, d) {
  return function(t) {
    return a + t * d;
  };
}

function hue(a, b) {
  var d = b - a;
  return d
    ? linear(a, d > 180 || d < -180 ? d - 360 * Math.round(d / 360) : d)
    : constant(isNaN(a) ? b : a);
}

function nogamma(a, b) {
  var d = b - a;
  return d ? linear(a, d) : constant(isNaN(a) ? b : a);
}

// Just like d3.interpolateHcl, except it works with objects
// and does not modify the input objects.
function interpolateHCL(start, end) {
  var h = hue(start.h, end.h),
    c = nogamma(start.c, end.c),
    l = nogamma(start.l, end.l),
    opacity = nogamma(start.opacity, end.opacity);
  return function(t) {
    return {
      h: h(t),
      c: c(t),
      l: l(t),
      opacity: opacity(t)
    };
  };
}

module.exports = interpolateHCL;
