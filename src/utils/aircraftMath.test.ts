import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateFlightCalculation,
  interpolateStoryProgress,
  formatDubaiTime,
  GULFSTREAM_650ER_SPECS,
} from './aircraftMath.ts';

test('G650ER specs has expected high-fidelity parameters', () => {
  assert.equal(GULFSTREAM_650ER_SPECS.maxRangeKm, 11260);
  assert.equal(GULFSTREAM_650ER_SPECS.maxSpeedKnots, 490);
  assert.equal(GULFSTREAM_650ER_SPECS.mach, 0.925);
  assert.equal(GULFSTREAM_650ER_SPECS.cabinLengthM, 14.05);
});

test('calculateFlightCalculation handles zero and valid distances', () => {
  const zero = calculateFlightCalculation(0);
  assert.equal(zero.hours, 0);
  assert.equal(zero.feasibleNonStop, true);

  // Dubai to London: approx 5,500 km
  const dxbToLhr = calculateFlightCalculation(5500);
  assert.ok(dxbToLhr.hours >= 6 && dxbToLhr.hours <= 7);
  assert.equal(dxbToLhr.feasibleNonStop, true);
  assert.ok(dxbToLhr.fuelMetric > 15000);

  // Beyond max range (>11,260 km, e.g. 14,000 km)
  const ultraLong = calculateFlightCalculation(14000);
  assert.equal(ultraLong.feasibleNonStop, false);
});

test('interpolateStoryProgress provides continuous bounds for all phases', () => {
  // 1. Initial Hero entry
  const start = interpolateStoryProgress(0);
  assert.equal(start.phase, 'hero');
  assert.equal(start.skyOpacity, 1);
  assert.equal(start.paperOpacity, 0);
  assert.equal(start.solidOpacity, 1);
  assert.equal(start.schematicOpacity, 0);

  // 2. Mid glide
  const midHero = interpolateStoryProgress(0.15);
  assert.equal(midHero.phase, 'hero');
  assert.ok(midHero.planeY > start.planeY);

  // 3. Specs phase
  const specs = interpolateStoryProgress(0.4);
  assert.equal(specs.phase, 'specs');
  assert.ok(specs.paperOpacity > 0);

  // 4. Schematic phase
  const schematic = interpolateStoryProgress(0.75);
  assert.equal(schematic.phase, 'schematic');
  assert.equal(schematic.solidOpacity, 0);
  assert.ok(schematic.schematicOpacity >= 0.8);

  // 5. Services phase
  const services = interpolateStoryProgress(0.95);
  assert.equal(services.phase, 'services');
});

test('formatDubaiTime returns valid time string format HH:MM', () => {
  const res = formatDubaiTime(new Date('2026-10-17T12:00:00Z'));
  assert.equal(res.cityStr, 'DUBAI UAE');
  assert.match(res.timeStr, /^\d{2}:\d{2}$/);
  // 12:00 UTC + 4h = 16:00
  assert.equal(res.timeStr, '16:00');
});
