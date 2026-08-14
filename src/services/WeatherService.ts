import axios from "axios";
import moment from "moment";

export type WeatherForecastData = {
    temperatureMax: number;
    temperatureMin: number;
    weatherCode: number;
    precipitationProbabilityMax?: number;
};

// Weather Code mapping for Open-Meteo (WMO Weather interpretation codes)
export const getWeatherInfoByCode = (code?: number) => {
    switch (code) {
        case 0:
            return { label: "晴朗", icon: "☀️", color: "text-amber-500" };
        case 1:
        case 2:
        case 3:
            return { label: "多雲/晴間多雲", icon: "⛅", color: "text-sky-400" };
        case 45:
        case 48:
            return { label: "有霧", icon: "🌫️", color: "text-slate-400" };
        case 51:
        case 53:
        case 55:
        case 56:
        case 57:
            return { label: "毛毛雨", icon: "🌧️", color: "text-blue-400" };
        case 61:
        case 63:
        case 65:
        case 66:
        case 67:
            return { label: "陣雨/降雨", icon: "🌧️", color: "text-blue-500" };
        case 71:
        case 73:
        case 75:
        case 77:
            return { label: "降雪", icon: "❄️", color: "text-indigo-300" };
        case 80:
        case 81:
        case 82:
            return { label: "強降雨/豪雨", icon: "🌧️", color: "text-blue-700" };
        case 95:
        case 96:
        case 99:
            return { label: "雷陣雨", icon: "⛈️", color: "text-purple-600" };
        default:
            return { label: "舒適", icon: "🌤️", color: "text-amber-400" };
    }
};

/**
 * Fetch daily weather forecast from Open-Meteo (Free & No API key needed)
 */
export const fetchDailyWeather = async (
    lat: number,
    lng: number,
    dateStr: string // Format: YYYY-MM-DD
): Promise<WeatherForecastData | null> => {
    // 判斷日期是否在 Open-Meteo 允許的預報範圍內 (歷史約前90天 至 未來約15天)
    const targetMoment = moment(dateStr, "YYYY-MM-DD", true).startOf("day");
    if (!targetMoment.isValid()) return null;

    const today = moment().startOf("day");
    const diffDays = targetMoment.diff(today, "days");

    // 超出可查詢日期範圍時直接不發送 API 請求
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

            // 避免 API 回傳 null 時 Math.round(null) 變成 0 (造成顯示 0°~0°C)
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
    } catch (err) {
        // Fallback silently if offline or API error
        return null;
    }
};
