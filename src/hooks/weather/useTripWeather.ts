import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import moment from "moment";
import {
    fetchTripWeatherForecast,
    fetchCurrentWeather,
    getWeatherInfoByCode,
    type WeatherForecastData,
    type CurrentWeatherData,
    type DailyWeatherMap,
} from "../../services/weather/WeatherService";
import { QUERY_KEYS } from "../../constants/QueryKeys";
import type { ItineraryVM } from "../../models/types/ItineraryTypes";
import type { PlaceVM } from "../../models/types/PlaceTypes";

export interface UseTripWeatherOptions {
    enabled?: boolean;
}

export interface UseTripWeatherParams {
    tripId?: string;
    itineraries?: ItineraryVM[];
    placesMap?: Record<string, PlaceVM>;
    startDate?: string | null;
    endDate?: string | null;
    fallbackCoordinates?: { lat: number; lng: number };
    options?: UseTripWeatherOptions;
}

export interface RainWarningDay {
    date: string;
    dayNumber?: number;
    title?: string;
    probability: number;
}

export interface UseTripWeatherResult {
    weatherMap: DailyWeatherMap;
    currentWeather: CurrentWeatherData | null;
    primaryCoordinate: { lat: number; lng: number } | null;
    locationName: string;
    isLoading: boolean;
    isError: boolean;
    getWeatherForDate: (dateStr?: string | null) => WeatherForecastData | null;
    getWeatherInfo: (weather?: WeatherForecastData | null) => ReturnType<typeof getWeatherInfoByCode>;
    hasRainWarning: boolean;
    todayRainWarning: boolean;
    rainDays: RainWarningDay[];
    refetch: () => void;
}

/**
 * 旅程整體氣象預報 Hook (useTripWeather)
 * 自動依行程景點座標與旅行日期批次獲取 Open-Meteo 免金鑰天氣預報
 */
export function useTripWeather({
    tripId: _tripId,
    itineraries,
    placesMap = {},
    startDate,
    endDate,
    fallbackCoordinates,
    options,
}: UseTripWeatherParams): UseTripWeatherResult {
    // 1. 計算代表性經緯度 (依第一個有效景點或回退座標)
    const { primaryCoordinate, locationName } = useMemo(() => {
        if (Array.isArray(itineraries)) {
            for (const day of itineraries) {
                if (Array.isArray(day.activities)) {
                    for (const act of day.activities) {
                        if (act.linkId && placesMap[act.linkId]) {
                            const p = placesMap[act.linkId];
                            if (typeof p.lat === "number" && typeof p.lng === "number" && !isNaN(p.lat) && !isNaN(p.lng)) {
                                return {
                                    primaryCoordinate: { lat: p.lat, lng: p.lng },
                                    locationName: p.name || "",
                                };
                            }
                        }
                    }
                }
            }
        }

        // 回退到 placesMap 中的任意有效景點
        for (const p of Object.values(placesMap)) {
            if (p && typeof p.lat === "number" && typeof p.lng === "number" && !isNaN(p.lat) && !isNaN(p.lng)) {
                return {
                    primaryCoordinate: { lat: p.lat, lng: p.lng },
                    locationName: p.name || "",
                };
            }
        }

        // 使用 fallbackCoordinates
        if (fallbackCoordinates && typeof fallbackCoordinates.lat === "number" && typeof fallbackCoordinates.lng === "number") {
            return {
                primaryCoordinate: fallbackCoordinates,
                locationName: "",
            };
        }

        return { primaryCoordinate: null, locationName: "" };
    }, [itineraries, placesMap, fallbackCoordinates]);

    // 2. 計算日期範圍
    const { finalStart, finalEnd } = useMemo(() => {
        let s = startDate || "";
        let e = endDate || "";

        if (Array.isArray(itineraries) && itineraries.length > 0) {
            const validDates = itineraries.map((d) => d.date).filter(Boolean).sort();
            if (validDates.length > 0) {
                if (!s || s > validDates[0]) s = validDates[0];
                if (!e || e < validDates[validDates.length - 1]) e = validDates[validDates.length - 1];
            }
        }

        return { finalStart: s, finalEnd: e };
    }, [startDate, endDate, itineraries]);

    const isCoordValid = !!primaryCoordinate && !isNaN(primaryCoordinate.lat) && !isNaN(primaryCoordinate.lng);
    const isEnabled = (options?.enabled ?? true) && isCoordValid && Boolean(finalStart) && Boolean(finalEnd);

    const validLat = isCoordValid ? primaryCoordinate!.lat : 0;
    const validLng = isCoordValid ? primaryCoordinate!.lng : 0;

    // 3. TanStack Query 批次查詢日期區間天氣預報
    const {
        data: weatherMap = {},
        isLoading: isForecastLoading,
        isError: isForecastError,
        refetch: refetchForecast,
    } = useQuery<DailyWeatherMap>({
        queryKey: QUERY_KEYS.weather.tripRange(validLat, validLng, finalStart, finalEnd),
        queryFn: async () => {
            if (!isCoordValid || !finalStart || !finalEnd) return {};
            return await fetchTripWeatherForecast(validLat, validLng, finalStart, finalEnd);
        },
        enabled: isEnabled,
        staleTime: 30 * 60 * 1000, // 30 分鐘快取
        gcTime: 60 * 60 * 1000,
    });

    // 4. TanStack Query 查詢當下即時天氣 (即時溫度、狀況)
    const {
        data: currentWeather = null,
        isLoading: isCurrentLoading,
        isError: isCurrentError,
        refetch: refetchCurrent,
    } = useQuery<CurrentWeatherData | null>({
        queryKey: QUERY_KEYS.weather.current(validLat, validLng),
        queryFn: async () => {
            if (!isCoordValid) return null;
            return await fetchCurrentWeather(validLat, validLng);
        },
        enabled: (options?.enabled ?? true) && isCoordValid,
        staleTime: 15 * 60 * 1000, // 15 分鐘快取
        gcTime: 60 * 60 * 1000,
    });

    // 輔助函式：根據指定日期字串獲取天氣
    const getWeatherForDate = (dateStr?: string | null): WeatherForecastData | null => {
        if (!dateStr || !weatherMap) return null;
        return weatherMap[dateStr] || null;
    };

    // 輔助函式：獲取天氣圖示與標籤
    const getWeatherInfo = (weather?: WeatherForecastData | null) => {
        return getWeatherInfoByCode(weather?.weatherCode);
    };

    // 計算降雨預警天數 (> 50% 降雨機率)
    const rainDays = useMemo(() => {
        if (!Array.isArray(itineraries)) return [];
        const alerts: RainWarningDay[] = [];

        itineraries.forEach((day) => {
            const w = weatherMap[day.date];
            if (w && typeof w.precipitationProbabilityMax === "number" && w.precipitationProbabilityMax >= 50) {
                alerts.push({
                    date: day.date,
                    dayNumber: day.day_number,
                    title: day.title ?? undefined,
                    probability: w.precipitationProbabilityMax,
                });
            }
        });

        return alerts;
    }, [itineraries, weatherMap]);

    const todayDate = moment().format("YYYY-MM-DD");
    const todayWeather = weatherMap[todayDate];
    const todayRainWarning = Boolean(
        todayWeather &&
        typeof todayWeather.precipitationProbabilityMax === "number" &&
        todayWeather.precipitationProbabilityMax >= 50
    );

    const refetch = () => {
        refetchForecast();
        refetchCurrent();
    };

    return {
        weatherMap,
        currentWeather,
        primaryCoordinate,
        locationName,
        isLoading: isForecastLoading || isCurrentLoading,
        isError: isForecastError || isCurrentError,
        getWeatherForDate,
        getWeatherInfo,
        hasRainWarning: rainDays.length > 0,
        todayRainWarning,
        rainDays,
        refetch,
    };
}

export default useTripWeather;
