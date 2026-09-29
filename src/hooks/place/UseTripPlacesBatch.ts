import { useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { placeRepo } from "../../services/repositories/PlaceRepo";
import { toPlaceVM } from "../../services/mappers/PlaceMapper";
import { QUERY_KEYS } from "../../constants/QueryKeys";
import type { PlaceVM } from "../../models/types/PlaceTypes";

export interface UseTripPlacesBatchResult {
    places: PlaceVM[];
    placeMap: Record<string, PlaceVM>;
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
    error: unknown;
    refetch: () => void;
}

/**
 * 批次取得指定地標清單並進行全域 TanStack Query 快取
 * 取代 View / Component 內分散的 placeRepo.getByIds 裸呼叫
 *
 * @param tripId 行程 ID (用於快取分組)
 * @param placeIds 地標 ID 陣列
 */
export const useTripPlacesBatch = (
    tripId: string | undefined,
    placeIds: string[] | undefined
): UseTripPlacesBatchResult => {
    // 濾除無效空值並去重
    const validIds = useMemo(() => {
        if (!placeIds || placeIds.length === 0) return [];
        return Array.from(new Set(placeIds.filter(Boolean)));
    }, [placeIds]);

    const safeTripId = tripId || "global";

    const {
        data: places = [],
        isLoading,
        isFetching,
        isError,
        error,
        refetch,
    } = useQuery<PlaceVM[]>({
        queryKey: QUERY_KEYS.places.batch(safeTripId, validIds),
        queryFn: async () => {
            if (validIds.length === 0) return [];
            const rows = await placeRepo.getByIds(validIds);
            return rows.map((r) => toPlaceVM(r));
        },
        enabled: validIds.length > 0,
        staleTime: 10 * 60 * 1000, // 10 分鐘避免重複打 API
        gcTime: 30 * 60 * 1000, // 保留 30 分鐘快取
        placeholderData: keepPreviousData,
    });

    // 建立以 Place ID 為鍵的索引查找 Map，方便 O(1) 查找
    const placeMap = useMemo(() => {
        const map: Record<string, PlaceVM> = {};
        for (const p of places) {
            if (p && p.id) {
                map[p.id] = p;
            }
        }
        return map;
    }, [places]);

    return {
        places,
        placeMap,
        isLoading,
        isFetching,
        isError,
        error,
        refetch,
    };
};

export default useTripPlacesBatch;
