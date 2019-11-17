var OLPE = require('one-listener-per-element');
var { setListener } = OLPE();

var manualUpdateModeCheckbox = document.getElementById(
  'manual-update-checkbox'
);

function wireControls({ refresh, manualUpdateMode, routeState }) {
  setListener({
    eventName: 'click',
    listener: refresh,
    element: document.getElementById('refresh-button')
  });
  setListener({
    eventName: 'change',
    listener: toggleManualUpdateMode,
    element: manualUpdateModeCheckbox
  });

  manualUpdateModeCheckbox.checked = manualUpdateMode;

  function toggleManualUpdateMode() {
    routeState.addToRoute({
      manualUpdateMode: manualUpdateModeCheckbox.checked
    });
  }
}

module.exports = wireControls;
