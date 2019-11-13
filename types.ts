export interface HCLColor {
  h: number;
  c: number;
  l: number;
  opacity: number;
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
