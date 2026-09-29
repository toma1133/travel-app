import axios from "axios";
import moment from "moment";

export type WeatherForecastData = {
    temperatureMax: number;
    temperatureMin: number;
    weatherCode: number;
    precipitationProbabilityMax?: number;
};

export type CurrentWeatherData = {
    temperature: number;
    weatherCode: number;
    precipitation?: number;
    time?: string;
};

export type DailyWeatherMap = Record<string, WeatherForecastData>;

// Weather Code mapping for Open-Meteo (WMO Weather interpretation codes)
export const getWeatherInfoByCode = (code?: number) => {
    switch (code) {
        case 0:
            return { label: "晴朗", icon: "☀️", color: "text-amber-500", bgLight: "bg-amber-500/10 text-amber-600" };
        case 1:
        case 2:
        case 3:
            return { label: "多雲/晴間多雲", icon: "⛅", color: "text-sky-400", bgLight: "bg-sky-500/10 text-sky-600" };
        case 45:
        case 48:
            return { label: "有霧", icon: "🌫️", color: "text-slate-400", bgLight: "bg-slate-500/10 text-slate-600" };
        case 51:
        case 53:
        case 55:
        case 56:
        case 57:
            return { label: "毛毛雨", icon: "🌧️", color: "text-blue-400", bgLight: "bg-blue-500/10 text-blue-600" };
        case 61:
        case 63:
        case 65:
        case 66:
        case 67:
            return { label: "陣雨/降雨", icon: "🌧️", color: "text-blue-500", bgLight: "bg-blue-500/10 text-blue-600" };
        case 71:
        case 73:
        case 75:
        case 77:
            return { label: "降雪", icon: "❄️", color: "text-indigo-300", bgLight: "bg-indigo-500/10 text-indigo-600" };
        case 80:
        case 81:
        case 82:
            return { label: "強降雨/豪雨", icon: "🌧️", color: "text-blue-700", bgLight: "bg-blue-700/10 text-blue-700" };
        case 95:
        case 96:
        case 99:
            return { label: "雷陣雨", icon: "⛈️", color: "text-purple-600", bgLight: "bg-purple-500/10 text-purple-600" };
        default:
            return { label: "舒適", icon: "🌤️", color: "text-amber-400", bgLight: "bg-amber-500/10 text-amber-600" };
    }
};

/**
 * Fetch daily weather forecast from Open-Meteo for a single day (Free & No API key needed)
 */
export const fetchDailyWeather = async (
    lat: number,
    lng: number,
    dateStr: string // Format: YYYY-MM-DD
): Promise<WeatherForecastData | null> => {
    const targetMoment = moment(dateStr, "YYYY-MM-DD", true).startOf("day");
    if (!targetMoment.isValid()) return null;

    const today = moment().startOf("day");
    const diffDays = targetMoment.diff(today, "days");

    // Open-Meteo allows roughly -90 days to +15 days for forecast API
    if (diffDays < -90 || diffDays > 15) {
        return null;
    }

    try {
        const response = await axios.get("https://api.open-meteo.com/v1/forecast", {
            params: {
                latitude: lat,
                longitude: lng,
                daily: "weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
                timezone: "auto",
                start_date: dateStr,
                end_date: dateStr,
            },
            timeout: 5000,
        });

        const daily = response.data?.daily;
        if (daily && daily.time && daily.time.length > 0) {
            const rawMax = daily.temperature_2m_max?.[0];
            const rawMin = daily.temperature_2m_min?.[0];

            if (
                typeof rawMax !== "number" ||
                typeof rawMin !== "number" ||
                isNaN(rawMax) ||
                isNaN(rawMin)
            ) {
                return null;
            }

            return {
                temperatureMax: Math.round(rawMax),
                temperatureMin: Math.round(rawMin),
                weatherCode: daily.weathercode?.[0] ?? 0,
                precipitationProbabilityMax: daily.precipitation_probability_max?.[0] ?? undefined,
            };
        }
        return null;
    } catch {
        return null;
    }
};

/**
 * Fetch multiple days of weather forecast for a trip in a single batch request
 */
export const fetchTripWeatherForecast = async (
    lat: number,
    lng: number,
    startDate: string,
    endDate: string
): Promise<DailyWeatherMap> => {
    const startMom = moment(startDate, "YYYY-MM-DD", true).startOf("day");
    const endMom = moment(endDate, "YYYY-MM-DD", true).startOf("day");
    if (!startMom.isValid() || !endMom.isValid() || startMom.isAfter(endMom)) {
        return {};
    }

    const today = moment().startOf("day");
    const minAllowed = moment(today).subtract(90, "days");
    const maxAllowed = moment(today).add(15, "days");

    // Clamp the date range to within the supported Open-Meteo window
    const clampedStart = moment.max(startMom, minAllowed);
    const clampedEnd = moment.min(endMom, maxAllowed);

    if (clampedStart.isAfter(clampedEnd)) {
        return {};
    }

    try {
        const queryStart = clampedStart.format("YYYY-MM-DD");
        const queryEnd = clampedEnd.format("YYYY-MM-DD");

        const response = await axios.get("https://api.open-meteo.com/v1/forecast", {
            params: {
                latitude: lat,
                longitude: lng,
                daily: "weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
                timezone: "auto",
                start_date: queryStart,
                end_date: queryEnd,
            },
            timeout: 6000,
        });

        const daily = response.data?.daily;
        const result: DailyWeatherMap = {};

        if (daily && Array.isArray(daily.time)) {
            daily.time.forEach((dateString: string, i: number) => {
                const rawMax = daily.temperature_2m_max?.[i];
                const rawMin = daily.temperature_2m_min?.[i];
                if (typeof rawMax === "number" && typeof rawMin === "number") {
                    result[dateString] = {
                        temperatureMax: Math.round(rawMax),
                        temperatureMin: Math.round(rawMin),
                        weatherCode: daily.weathercode?.[i] ?? 0,
                        precipitationProbabilityMax: daily.precipitation_probability_max?.[i] ?? undefined,
                    };
                }
            });
        }

        return result;
    } catch {
        return {};
    }
};

/**
 * Fetch current real-time weather at the specified coordinate
 */
export const fetchCurrentWeather = async (
    lat: number,
    lng: number
): Promise<CurrentWeatherData | null> => {
    try {
        const response = await axios.get("https://api.open-meteo.com/v1/forecast", {
            params: {
                latitude: lat,
                longitude: lng,
                current_weather: true,
                timezone: "auto",
            },
            timeout: 4000,
        });

        const current = response.data?.current_weather;
        if (current && typeof current.temperature === "number") {
            return {
                temperature: Math.round(current.temperature),
                weatherCode: current.weathercode ?? 0,
                time: current.time,
            };
        }
        return null;
    } catch {
        return null;
    }
};

const WeatherService = {
    fetchDailyWeather,
    fetchTripWeatherForecast,
    fetchCurrentWeather,
    getWeatherInfoByCode,
};

export default WeatherService;
