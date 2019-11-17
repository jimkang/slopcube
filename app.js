var handleError = require('handle-error-web');
var RouteState = require('route-state');
var seedrandom = require('seedrandom');
var wireControls = require('./dom/wire-controls');
var RefreshScheduler = require('./refresh-scheduler');
var slopFlow = require('./flows/slop-flow');
var d3 = require('d3-selection');

var routeState = RouteState({
  followRoute,
  windowObject: window,
  propsToCoerceToBool: ['hideUI', 'debug', 'manualUpdateMode']
});

(function go() {
  window.onerror = reportTopLevelError;
  routeState.routeFromHash();
})();

function followRoute({ seed, hideUI, debug, manualUpdateMode }) {
  var refreshScheduler = RefreshScheduler({ refresh: seedWithDate });
  wireControls({
    refresh: seedWithDate,
    manualUpdateMode,
    routeState
  });

  if (manualUpdateMode) {
    refreshScheduler.unschedule();
  } else {
    refreshScheduler.schedule();
  }

  d3.select(document.body).classed('hide-ui', hideUI);
  d3.select(document.body).classed('debug', debug);

  if (!seed) {
    seedWithDate();
    return;
  }

  var random = seedrandom(seed);

  slopFlow({ random });
}

function seedWithDate() {
  routeState.addToRoute({ seed: new Date().toISOString() });
}

function reportTopLevelError(msg, url, lineNo, columnNo, error) {
  handleError(error);
}
