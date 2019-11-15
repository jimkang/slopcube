var { hcl } = require('d3-color');

export interface HCLColor {
  h: number;
  c: number;
  l: number;
  opacity: number;
  rgbString: string;
}

export interface Spot {
  pt: [number, number];
  color: HCLColor;
  contourIndex?: number;
}

export interface Line {
  id: string;
  coords: [[number, number], [number, number]];
  ptA: Spot;
  ptB: Spot;
}

export interface LinearGradient {
  id: string;
  x1: string;
  x2: string;
  y1: string;
  y2: string;
  beginColor: HCLColor;
  endColor: HCLColor;
  beginColorAnimValues: string;
  endColorAnimValues: string;
}

/*
Avoid:
> var a = { one: [1, 0] }
undefined
> b = { two: a.one }
{ two: [ 1, 0 ] }
> a.one[1] = 2
2
> b
{ two: [ 1, 2 ] }
> 
*/
export function copyPt(pt): [number, number] {
  return [pt[0], pt[1]];
}

export interface Hexagon {
  center: Spot;
  edgeVertices: Array<Spot>;
}

export interface Layout {
  hexagon: Hexagon;
  cubeLines: { radialLines: Array<Line>; cyclicLines: Array<Line> };
  contourLines: Array<Line>;
}

export function getRGBString(h, c, l, opacity) {
  var d3HCLColor = hcl(h, c, l, opacity);
  return d3HCLColor.formatRgb(); // formatHsl gives you negative percentages sometimes?!
}

export function HCL(h, c, l, opacity): HCLColor {
  return {
    h,
    c,
    l,
    opacity,
    rgbString: getRGBString(h, c, l, opacity)
  };
}
