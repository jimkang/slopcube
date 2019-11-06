var handleError = require('handle-error-web');
var RouteState = require('route-state');
var seedrandom = require('seedrandom');
var wireControls = require('./dom/wire-controls');
var Probable = require('probable').createProbable;
var RefreshScheduler = require('./refresh-scheduler');
var slopFlow = require('./flows/slop-flow');

var routeState = RouteState({
  followRoute,
  windowObject: window
});

(function go() {
  window.onerror = reportTopLevelError;
  routeState.routeFromHash();
})();

function followRoute({ seed, hideUI }) {
  var refreshScheduler = RefreshScheduler({ refresh: seedWithDate });
  wireControls({
    refresh: seedWithDate,
    scheduleRefresh: refreshScheduler.schedule,
    unscheduleRefresh: refreshScheduler.unschedule
  });

  if (hideUI === 'yes') {
    document.body.classList.add('hide-ui');
  } else {
    document.body.classList.remove('hide-ui');
  }

  if (!seed) {
    seedWithDate();
    return;
  }

  var random = seedrandom(seed);
  var probable = Probable({ random });

  slopFlow({ probable });
}

function seedWithDate() {
  routeState.addToRoute({ seed: new Date().toISOString() });
}

function reportTopLevelError(msg, url, lineNo, columnNo, error) {
  handleError(error);
}
