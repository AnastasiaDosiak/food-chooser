const EARTH_RADIUS_METERS = 6371000;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Great-circle distance in metres between two lat/lon points. */
export const haversineMeters = (
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
): number => {
  const deltaLat = toRadians(latitudeB - latitudeA);
  const deltaLon = toRadians(longitudeB - longitudeA);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(latitudeA)) * Math.cos(toRadians(latitudeB)) * Math.sin(deltaLon / 2) ** 2;
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
