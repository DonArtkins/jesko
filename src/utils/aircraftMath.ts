/**
 * Pure aircraft calculation and story timeline interpolation logic
 * for the Jesko Jets Gulfstream G650ER cinematic experience.
 */

export interface AircraftSpecs {
  model: string;
  maxRangeKm: number;
  maxRangeNm: number;
  maxSpeedKnots: number;
  mach: number;
  cruiseAltitudeM: number;
  cruiseAltitudeFt: number;
  baggageCapacityM3: number;
  seatsMax: number;
  cabinLengthM: number;
  cabinWidthM: number;
  cabinHeightM: number;
}

export const GULFSTREAM_650ER_SPECS: AircraftSpecs = {
  model: 'Gulfstream G650ER',
  maxRangeKm: 11260,
  maxRangeNm: 6080,
  maxSpeedKnots: 490, // Cruising / high speed in knots
  mach: 0.925,
  cruiseAltitudeM: 15544,
  cruiseAltitudeFt: 51000,
  baggageCapacityM3: 5.52,
  seatsMax: 13,
  cabinLengthM: 14.05,
  cabinWidthM: 2.49,
  cabinHeightM: 1.92,
};

export interface StoryTimelineState {
  planeY: number;
  planeZ: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  scale: number;
  solidOpacity: number;
  schematicOpacity: number;
  skyOpacity: number;
  paperOpacity: number;
  phase: 'hero' | 'specs' | 'schematic' | 'services';
}

/**
 * Calculates flight duration and feasibility for a given distance.
 */
export function calculateFlightCalculation(distanceKm: number, speedKnots: number = 490) {
  if (distanceKm <= 0) {
    return {
      hours: 0,
      minutes: 0,
      formatted: '0h 00m',
      feasibleNonStop: true,
      fuelMetric: 0,
    };
  }

  // 1 knot = 1.852 km/h
  const speedKmH = speedKnots * 1.852;
  const rawHours = distanceKm / speedKmH;
  // Add 0.35 hours (21 min) for taxi, climb, and descent approach
  const totalHours = rawHours + 0.35;
  const h = Math.floor(totalHours);
  const m = Math.round((totalHours - h) * 60);

  const feasibleNonStop = distanceKm <= GULFSTREAM_650ER_SPECS.maxRangeKm;

  return {
    hours: h,
    minutes: m,
    formatted: `${h}h ${m < 10 ? '0' : ''}${m}m`,
    feasibleNonStop,
    fuelMetric: Math.round(distanceKm * 3.8), // ~3.8 kg fuel per km
  };
}

/**
 * Interpolates smooth story timeline state across the 4 key stages:
 * Stage 1 (0.00 - 0.25): Hero entry & corridor glide (sky background)
 * Stage 2 (0.25 - 0.55): Specs reveal & transition to sand drafting paper
 * Stage 3 (0.55 - 0.80): Top-down alignment & morph into cabin cutaway schematic
 * Stage 4 (0.80 - 1.00): Fleet & onboard lifestyle services
 */
export function interpolateStoryProgress(progress: number): StoryTimelineState {
  const p = Math.max(0, Math.min(1, progress));

  if (p < 0.28) {
    // Stage 1: Gliding from below up into the open corridor
    const t = p / 0.28;
    // t goes 0 -> 1
    return {
      planeY: -3.8 + t * 4.2, // ascends smoothly into viewport
      planeZ: -2.0 + t * 2.0,
      rotX: -0.28 + t * 0.26, // nose pitched slightly up, flattening out
      rotY: Math.sin(t * Math.PI) * 0.12, // subtle aerodynamic bank
      rotZ: -Math.sin(t * Math.PI) * 0.08, // wing tilt
      scale: 0.85 + t * 0.25,
      solidOpacity: 1,
      schematicOpacity: 0,
      skyOpacity: 1,
      paperOpacity: 0,
      phase: 'hero',
    };
  } else if (p < 0.55) {
    // Stage 2: Specs phase - plane remains pristine solid titanium, paper background fades in
    const t = (p - 0.28) / (0.55 - 0.28);
    return {
      planeY: 0.2 + t * 0.4,
      planeZ: 0,
      rotX: -0.02 + t * 0.08,
      rotY: 0.04 * (1 - t),
      rotZ: 0,
      scale: 1.05 - t * 0.1,
      solidOpacity: 1.0,
      schematicOpacity: 0.0,
      skyOpacity: 1 - t,
      paperOpacity: t,
      phase: 'specs',
    };
  } else if (p < 0.82) {
    // Stage 3: Top-down alignment and transition into architectural technical cutaway schematic
    const t = (p - 0.55) / (0.82 - 0.55);
    return {
      planeY: 0.2 - t * 0.2, // centered below header
      planeZ: 0,
      rotX: 0, // perfectly flat top-down
      rotY: 0,
      rotZ: 0,
      scale: 0.88 - t * 0.04,
      solidOpacity: Math.max(0, 1 - t * 1.6), // solid skin dissolves smoothly
      schematicOpacity: Math.min(1, t * 1.3), // blueprint lines and interior emerge
      skyOpacity: 0,
      paperOpacity: 1,
      phase: 'schematic',
    };
  } else {
    // Stage 4: Lifestyle services & holding view
    const t = (p - 0.82) / (1 - 0.82);
    return {
      planeY: 0.5 - t * 0.3,
      planeZ: 0,
      rotX: 0,
      rotY: 0,
      rotZ: 0,
      scale: 0.85,
      solidOpacity: 0,
      schematicOpacity: Math.max(0.3, 1 - t * 0.4),
      skyOpacity: 0,
      paperOpacity: 1,
      phase: 'services',
    };
  }
}

/**
 * Returns formatted Dubai time (UTC+4).
 */
export function formatDubaiTime(now: Date = new Date()): { timeStr: string; cityStr: string } {
  // Dubai is UTC+4 without daylight savings
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const dubaiDate = new Date(utc + 3600000 * 4);
  const hours = String(dubaiDate.getHours()).padStart(2, '0');
  const minutes = String(dubaiDate.getMinutes()).padStart(2, '0');
  return {
    timeStr: `${hours}:${minutes}`,
    cityStr: 'DUBAI UAE',
  };
}
