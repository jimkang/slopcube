var OLPE = require('one-listener-per-element');
var { setListener } = OLPE();

var autoupdateCheckbox = document.getElementById('autoupdate-checkbox');

function wireControls({ refresh, scheduleRefresh, unscheduleRefresh }) {
  setListener({
    eventName: 'click',
    listener: refresh,
    element: document.getElementById('refresh-button')
  });
  setListener({
    eventName: 'change',
    listener: toggleSchedule,
    element: autoupdateCheckbox
  });

  toggleSchedule();

  function toggleSchedule() {
    if (autoupdateCheckbox.checked) {
      scheduleRefresh();
    } else {
      unscheduleRefresh();
    }
  }
}

module.exports = wireControls;
