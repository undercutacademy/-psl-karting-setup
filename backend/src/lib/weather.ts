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

// Value formatters shared by the PDF and email renderers. Pressure is
// displayed in mbar — numerically identical to the stored hPa value.
export function formatTemp(tempC?: number | null): string | null {
  return tempC != null ? `${tempC.toFixed(1)} °C` : null;
}

export function formatHumidity(humidityPct?: number | null): string | null {
  return humidityPct != null ? `${Math.round(humidityPct)}%` : null;
}

export function formatPressure(pressureHpa?: number | null): string | null {
  return pressureHpa != null ? `${Math.round(pressureHpa)} mbar` : null;
}
