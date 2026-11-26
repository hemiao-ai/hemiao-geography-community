import { describe, expect, it } from "vitest";
import { CITIES, dayLength, declination, localTime, noonAltitude, solarElevation, SOLAR_TERMS, subsolarLon } from "./astro";

describe("地球的运动", () => {
  it("二分二至的直射点", () => {
    expect(declination(SOLAR_TERMS.summer.day)).toBeCloseTo(23.44, 1);
    expect(declination(SOLAR_TERMS.winter.day)).toBeCloseTo(-23.44, 1);
    expect(Math.abs(declination(SOLAR_TERMS.spring.day))).toBeLessThan(0.5);
    expect(Math.abs(declination(SOLAR_TERMS.autumn.day))).toBeLessThan(1);
  });
  it("昼长", () => {
    expect(dayLength(CITIES.beijing.lat, 172)).toBeGreaterThan(14.6);
    expect(dayLength(CITIES.beijing.lat, 172)).toBeLessThan(15.2);
    expect(dayLength(CITIES.sydney.lat, 172)).toBeLessThan(10.2);
    for (const n of [1, 100, 172, 300]) expect(dayLength(0, n)).toBeCloseTo(12, 5);
    expect(dayLength(70, 172)).toBe(24);
    expect(dayLength(70, 355)).toBe(0);
  });
  it("正午太阳高度与地方时", () => {
    expect(noonAltitude(23.44, 172)).toBeCloseTo(90, 0);
    expect(localTime(120, 4)).toBe(12);
    expect(localTime(-90, 2)).toBe(20);
    expect(subsolarLon(4)).toBe(120);
    expect(solarElevation(CITIES.beijing.lat, CITIES.beijing.lon, 172, 4.24)).toBeGreaterThan(70);
    expect(solarElevation(CITIES.beijing.lat, CITIES.beijing.lon, 172, 16.24)).toBeLessThan(0);
  });
});
