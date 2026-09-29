import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    fetchDailyWeather,
    getWeatherInfoByCode,
    type WeatherForecastData,
} from "../../services/WeatherService";
import { QUERY_KEYS } from "../../constants/QueryKeys";

export interface UseDailyWeatherOptions {
    enabled?: boolean;
}

export interface UseDailyWeatherResult {
    weather: WeatherForecastData | null;
    weatherInfo: ReturnType<typeof getWeatherInfoByCode>;
    isLoading: boolean;
    isError: boolean;
    error: unknown;
    refetch: () => void;
}

/**
 * 查詢每日天氣預報的 React Query Hook
 * 自動以四捨五入經緯度（約10公尺精度）與日期為快取 Key，防止相同地點多個活動重送重複請求
 *
 * @param lat 緯度
 * @param lng 經度
 * @param dateStr 查詢日期 (YYYY-MM-DD)
 * @param options 額外配置 (如 enabled)
 */
export const useDailyWeather = (
    lat: number | undefined,
    lng: number | undefined,
    dateStr: string | undefined,
    options?: UseDailyWeatherOptions
): UseDailyWeatherResult => {
    const isCoordinateValid =
        typeof lat === "number" &&
        typeof lng === "number" &&
        !isNaN(lat) &&
        !isNaN(lng);

    const isEnabled =
        (options?.enabled ?? true) &&
        isCoordinateValid &&
        Boolean(dateStr);

    const validLat = isCoordinateValid ? lat! : 0;
    const validLng = isCoordinateValid ? lng! : 0;
    const validDate = dateStr ?? "";

    const {
        data: weather = null,
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery<WeatherForecastData | null>({
        queryKey: QUERY_KEYS.weather.daily(validLat, validLng, validDate),
        queryFn: async () => {
            if (!isCoordinateValid || !dateStr) return null;
            return await fetchDailyWeather(validLat, validLng, validDate);
        },
        enabled: isEnabled,
        staleTime: 30 * 60 * 1000, // 30 分鐘快取
        gcTime: 60 * 60 * 1000, // 1 小時記憶體保留
    });

    const weatherInfo = useMemo(() => {
        return getWeatherInfoByCode(weather?.weatherCode);
    }, [weather?.weatherCode]);

    return {
        weather,
        weatherInfo,
        isLoading,
        isError,
        error,
        refetch,
    };
};

export default useDailyWeather;
