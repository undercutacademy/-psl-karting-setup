// Plausible-on-Earth ranges; anything outside is treated as API/client garbage.
const WEATHER_RANGES: Record<string, { min: number; max: number }> = {
  weatherTempC: { min: -30, max: 55 },
  weatherPressureHpa: { min: 800, max: 1100 },
  weatherHumidityPct: { min: 0, max: 100 },
};

// Weather is auxiliary data: invalid values become null instead of failing
// the submission. Keys that are absent stay absent so PUT doesn't clobber
// stored values the caller never sent.
export function normalizeWeatherFields(data: any): void {
  for (const [key, range] of Object.entries(WEATHER_RANGES)) {
    if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
    const num = typeof data[key] === 'number' ? data[key] : parseFloat(data[key]);
    data[key] = Number.isFinite(num) && num >= range.min && num <= range.max ? num : null;
  }
}

// "24.3 °C · 62% · 1013 hPa" from whichever readings are present; '' if none.
export function formatConditions(s: {
  weatherTempC?: number | null;
  weatherPressureHpa?: number | null;
  weatherHumidityPct?: number | null;
}): string {
  const parts: string[] = [];
  if (s.weatherTempC != null) parts.push(`${s.weatherTempC.toFixed(1)} °C`);
  if (s.weatherHumidityPct != null) parts.push(`${Math.round(s.weatherHumidityPct)}%`);
  if (s.weatherPressureHpa != null) parts.push(`${Math.round(s.weatherPressureHpa)} hPa`);
  return parts.join(' · ');
}
