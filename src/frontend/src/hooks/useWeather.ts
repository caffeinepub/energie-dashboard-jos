import { useCallback, useState } from "react";

export interface WeatherData {
  month: number;
  year: number;
  avgTempC: number;
  minTempC: number;
  maxTempC: number;
  humidity: number;
  precipitation: number;
}

export interface LocationData {
  city: string;
  latitude: number;
  longitude: number;
}

const LOCATION_KEY = "energyDashboard_location";

function weatherKey(year: number, month: number) {
  return `energyDashboard_weather_${year}_${month}`;
}

function avg(arr: number[]) {
  const valid = arr.filter((v) => v != null && !Number.isNaN(v));
  if (valid.length === 0) return 0;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function sum(arr: number[]) {
  return arr
    .filter((v) => v != null && !Number.isNaN(v))
    .reduce((a, b) => a + b, 0);
}

async function fetchWeatherForMonth(
  lat: number,
  lon: number,
  year: number,
  month: number,
): Promise<WeatherData> {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const startDate = `${year}-${pad(month)}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${pad(month)}-${lastDay}`;

  const now = new Date();
  const isCurrentOrFuture =
    year > now.getFullYear() ||
    (year === now.getFullYear() && month >= now.getMonth() + 1);

  let data: {
    daily?: {
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      precipitation_sum: number[];
      relative_humidity_2m_max: number[];
    };
    hourly?: {
      temperature_2m: number[];
      relative_humidity_2m: number[];
      precipitation: number[];
    };
  };

  if (isCurrentOrFuture) {
    // Use forecast API for current/future months
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_max&timezone=Europe%2FAmsterdam`;
    const res = await fetch(url);
    data = await res.json();
  } else {
    // Use archive API for historical months
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_max&timezone=Europe%2FAmsterdam`;
    const res = await fetch(url);
    data = await res.json();
  }

  if (!data.daily) {
    throw new Error("No daily data returned from weather API");
  }

  const maxTemps = data.daily.temperature_2m_max || [];
  const minTemps = data.daily.temperature_2m_min || [];
  const precip = data.daily.precipitation_sum || [];
  const humidity = data.daily.relative_humidity_2m_max || [];

  return {
    month,
    year,
    maxTempC: avg(maxTemps),
    minTempC: avg(minTemps),
    avgTempC: (avg(maxTemps) + avg(minTemps)) / 2,
    precipitation: sum(precip),
    humidity: avg(humidity),
  };
}

export function useWeather() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const getLocation = useCallback((): LocationData | null => {
    try {
      const raw = localStorage.getItem(LOCATION_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as LocationData;
    } catch {
      return null;
    }
  }, []);

  const saveLocation = useCallback(
    (city: string, latitude: number, longitude: number) => {
      const loc: LocationData = { city, latitude, longitude };
      localStorage.setItem(LOCATION_KEY, JSON.stringify(loc));
    },
    [],
  );

  const getWeatherForMonth = useCallback(
    (year: number, month: number): WeatherData | null => {
      try {
        const raw = localStorage.getItem(weatherKey(year, month));
        if (!raw) return null;
        return JSON.parse(raw) as WeatherData;
      } catch {
        return null;
      }
    },
    [],
  );

  const fetchAndSaveWeather = useCallback(
    async (year: number, month: number): Promise<WeatherData | null> => {
      const loc = getLocation();
      if (!loc) {
        setError("Geen locatie ingesteld");
        return null;
      }
      try {
        const data = await fetchWeatherForMonth(
          loc.latitude,
          loc.longitude,
          year,
          month,
        );
        localStorage.setItem(weatherKey(year, month), JSON.stringify(data));
        return data;
      } catch (e) {
        console.error("Weather fetch error:", e);
        setError(`Fout bij ophalen weerdata voor maand ${month}`);
        return null;
      }
    },
    [getLocation],
  );

  const fetchAndSaveAllWeatherForYear = useCallback(
    async (year: number): Promise<void> => {
      const loc = getLocation();
      if (!loc) {
        setError("Geen locatie ingesteld. Sla eerst een locatie op.");
        return;
      }
      setIsLoading(true);
      setError(null);
      setLoadingProgress(0);

      for (let month = 1; month <= 12; month++) {
        try {
          const data = await fetchWeatherForMonth(
            loc.latitude,
            loc.longitude,
            year,
            month,
          );
          localStorage.setItem(weatherKey(year, month), JSON.stringify(data));
        } catch (e) {
          console.error(`Weather fetch error month ${month}:`, e);
        }
        setLoadingProgress(Math.round((month / 12) * 100));
        // Small delay to avoid rate limiting
        await new Promise((r) => setTimeout(r, 200));
      }

      setIsLoading(false);
    },
    [getLocation],
  );

  const getLoadedMonthsForYear = useCallback(
    (year: number): number[] => {
      const loaded: number[] = [];
      for (let m = 1; m <= 12; m++) {
        if (getWeatherForMonth(year, m) !== null) {
          loaded.push(m);
        }
      }
      return loaded;
    },
    [getWeatherForMonth],
  );

  return {
    getLocation,
    saveLocation,
    getWeatherForMonth,
    fetchAndSaveWeather,
    fetchAndSaveAllWeatherForYear,
    getLoadedMonthsForYear,
    isLoading,
    loadingProgress,
    error,
    setError,
  };
}
