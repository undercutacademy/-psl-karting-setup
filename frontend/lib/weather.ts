export interface WeatherData {
  tempC: number;
  pressureHpa: number;
  humidityPct: number;
}

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: false, // weather needs city-block accuracy, not GPS precision
  timeout: 10_000,
  maximumAge: 600_000, // a cached fix up to 10 minutes old is fine
};

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation unavailable'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, GEO_OPTIONS);
  });
}

// Fetches current conditions for the device's location from Open-Meteo.
// surface_pressure (not sea-level) — carburation cares about actual air
// density at track elevation. Returns null on ANY failure (permission
// denied, timeout, offline, bad response): weather never blocks a submission.
export async function fetchCurrentWeather(): Promise<WeatherData | null> {
  try {
    const pos = await getPosition();
    // ~110 m precision — enough for weather, avoids sending an exact
    // position to a third party.
    const lat = pos.coords.latitude.toFixed(3);
    const lon = pos.coords.longitude.toFixed(3);
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,surface_pressure`
    );
    if (!res.ok) return null;
    const body = await res.json();
    const tempC = Number(body?.current?.temperature_2m);
    const humidityPct = Number(body?.current?.relative_humidity_2m);
    const pressureHpa = Number(body?.current?.surface_pressure);
    if (![tempC, humidityPct, pressureHpa].every(Number.isFinite)) return null;
    return { tempC, pressureHpa, humidityPct };
  } catch {
    return null;
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
