import { useEffect } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { shoppingRepo } from "../../services/repositories/ShoppingRepo";
import { supabaseClient } from "../../services/SupabaseClient";
import type { ShoppingItemVM } from "../../models/types/ShoppingTypes";

const useShoppingItems = (tripId: string | undefined) => {
    const qc = useQueryClient();

    // Setup Supabase Realtime subscription for live collaboration
    useEffect(() => {
        if (!tripId) return;

        const channel = supabaseClient
            .channel(`shopping_items_trip_${tripId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "shopping_items",
                    filter: `trip_id=eq.${tripId}`,
                },
                () => {
                    qc.invalidateQueries({ queryKey: ["shopping_items", tripId] });
                }
            )
            .subscribe();

        return () => {
            supabaseClient.removeChannel(channel);
        };
    }, [tripId, qc]);

    return useQuery<ShoppingItemVM[]>({
        queryKey: ["shopping_items", tripId],
        queryFn: async () => {
            const rows = await shoppingRepo.list(tripId);
            return rows;
        },
        staleTime: 30_000,
        placeholderData: keepPreviousData,
    });
};

export default useShoppingItems;
