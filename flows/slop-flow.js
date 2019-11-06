function slopFlow({ probable, randomId }) {
  var darkBG = probable.roll(3) > 0;
  document.body.classList[darkBG ? 'add' : 'remove']('dark');
  document.body.classList[darkBG ? 'remove' : 'add']('light');
}

module.exports = slopFlow;
