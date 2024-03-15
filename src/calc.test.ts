import { XY, sincos } from "./calc";

test("sincos_11", () => {
  const r = sincos(1, 1);
  expect(r.cos).toBeCloseTo(1, 1e-30);
  expect(r.sin).toBeCloseTo(0, 1e-30);
});

test("sincos_14", () => {
  const r = sincos(1, 4);
  expect(r.cos).toBeCloseTo(0, 1e-30);
  expect(r.sin).toBeCloseTo(1, 1e-30);
});
