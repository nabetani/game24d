import { XY, sincos, Segment } from "./calc";

test("sincos.1.1", () => {
  const r = sincos(1, 1);
  expect(r.cos).toBeCloseTo(1, 1e-30);
  expect(r.sin).toBeCloseTo(0, 1e-30);
});

test("sincos.1.4", () => {
  const r = sincos(1, 4);
  expect(r.cos).toBeCloseTo(0, 1e-30);
  expect(r.sin).toBeCloseTo(1, 1e-30);
});

test("sincos.1", () => {
  const r = sincos(1);
  expect(r.cos).toBeCloseTo(Math.cos(1), 1e-30);
  expect(r.sin).toBeCloseTo(Math.sin(1), 1e-30);
});

test("Segment.Dist.a", () => {
  const s0 = new XY(0, 0);
  const s1 = new XY(1, 0);
  const seg = Segment.fromEnds(s0, s1)
  const p1 = new XY(1, 0);
  expect(seg.dist(new XY(0, 0))).toBeCloseTo(0, 1e-30)
  expect(seg.dist(new XY(0.5, 0))).toBeCloseTo(0, 1e-30)
  expect(seg.dist(new XY(1, 0))).toBeCloseTo(0, 1e-30)
  expect(seg.dist(new XY(2, 0))).toBeCloseTo(1, 1e-30)
  expect(seg.dist(new XY(1, 1))).toBeCloseTo(1, 1e-30)
  expect(seg.dist(new XY(0, -1))).toBeCloseTo(1, 1e-30)
  expect(seg.dist(new XY(0.25, 1))).toBeCloseTo(1, 1e-30)
  expect(seg.dist(new XY(0.75, -1))).toBeCloseTo(1, 1e-30)
});
