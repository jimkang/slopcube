export interface HSLColor {
  h: number;
  s: number;
  l: number;
}

export interface Spot {
  pt: [number, number];
  color: HSLColor;
  contourIndex?: number;
}

export interface Line {
  id: string;
  coords: [[number, number], [number, number]];
  ptA: Spot;
  ptB: Spot;
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
