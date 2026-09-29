import { describe, expect, it } from 'vitest';
import { haversineKm, kmAtNearestPoint, pointAtKm, polylineLengthKm, progressToRouteKm, splitAtKm, straightLine } from './route';
import type { LatLon } from './types';

const berlin: LatLon = [52.52, 13.405];
const hamburg: LatLon = [53.5511, 9.9937];

describe('haversineKm', () => {
  it('Berlin–Hamburg is about 255 km', () => {
    expect(haversineKm(berlin, hamburg)).toBeGreaterThan(250);
    expect(haversineKm(berlin, hamburg)).toBeLessThan(260);
  });
  it('zero for identical points', () => {
    expect(haversineKm(berlin, berlin)).toBe(0);
  });
});

describe('polyline helpers', () => {
  const line: LatLon[] = [[0, 0], [0, 1], [0, 2]]; // ~111.19 km per degree at equator
  it('length sums segments', () => {
    expect(polylineLengthKm(line)).toBeCloseTo(2 * 111.19, 0);
  });
  it('pointAtKm interpolates and clamps', () => {
    const half = pointAtKm(line, 111.19);
    expect(half[0]).toBeCloseTo(0, 5);
    expect(half[1]).toBeCloseTo(1, 2);
    expect(pointAtKm(line, -5)).toEqual([0, 0]);
    expect(pointAtKm(line, 10_000)).toEqual([0, 2]);
    expect(pointAtKm([], 5)).toEqual([0, 0]);
  });
  it('splitAtKm returns done and todo sharing the split point', () => {
    const { done, todo } = splitAtKm(line, 55.6);
    expect(done[0]).toEqual([0, 0]);
    expect(done[done.length - 1][1]).toBeCloseTo(0.5, 2);
    expect(todo[0]).toEqual(done[done.length - 1]);
    expect(todo[todo.length - 1]).toEqual([0, 2]);
    expect(splitAtKm(line, 0).done).toEqual([[0, 0]]);
    expect(splitAtKm(line, 999).todo).toEqual([[0, 2]]);
  });
  it('straightLine returns segments+1 points from a to b', () => {
    const pts = straightLine(berlin, hamburg, 8);
    expect(pts).toHaveLength(9);
    expect(pts[0]).toEqual(berlin);
    expect(pts[8][0]).toBeCloseTo(hamburg[0], 6);
    expect(pts[8][1]).toBeCloseTo(hamburg[1], 6);
    expect(polylineLengthKm(pts)).toBeCloseTo(haversineKm(berlin, hamburg), 0);
  });
  it('kmAtNearestPoint finds the nearest vertex position', () => {
    expect(kmAtNearestPoint(line, [0.01, 1.02])).toBeCloseTo(111.19, 0);
    expect(kmAtNearestPoint(line, [0, 0])).toBe(0);
  });
  it('progressToRouteKm scales when route length differs from target', () => {
    expect(progressToRouteKm(255, 510, 600)).toBe(300);
    expect(progressToRouteKm(600, 510, 600)).toBe(600);
    expect(progressToRouteKm(10, 0, 600)).toBe(0);
  });
});
