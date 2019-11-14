import { HCLColor } from './types';
var { hcl } = require('d3-color');

function hclColorToD3(color: HCLColor) {
  return hcl(color.h, color.c, color.l, color.opacity);
}

module.exports = hclColorToD3;
