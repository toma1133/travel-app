import { supabaseClient } from "./SupabaseClient";
import { itineraryRepo } from "./repositories/ItineraryRepo";
import { planItinerarySync, planSafeDayRenumbering } from "../utils/ItinerarySyncUtil";
import type { TripRow } from "../models/types/TripTypes";

type SyncResult = { added: number; updated: number; removed: number };
const syncQueues = new Map<string, Promise<SyncResult>>();

async function performSync(trip: TripRow): Promise<SyncResult> {
    let added = 0;
    const updatedIds = new Set<string>();
    const removedIds = new Set<string>();
    for (let attempt = 0; attempt < 2; attempt++) {
        const existing = await itineraryRepo.list(trip.id);
        const plan = planItinerarySync(trip, existing);
        const removed = new Set(plan.deletes);
        const operations = planSafeDayRenumbering(existing.filter(day => !removed.has(day.id)), plan.updates);
        try {
            // Release numbers held by out-of-range days before renumbering or inserts.
            if (plan.deletes.length) {
                const { error } = await supabaseClient.from("itinerary_days").delete().eq("trip_id", trip.id).in("id", plan.deletes);
                if (error) throw error;
                plan.deletes.forEach(id => removedIds.add(id));
            }
            for (const update of operations) {
                const { error } = await supabaseClient.from("itinerary_days").update({ day_number: update.day_number }).eq("trip_id", trip.id).eq("id", update.id);
                if (error) throw error;
                if (plan.updates.some(target => target.id === update.id && target.day_number === update.day_number)) updatedIds.add(update.id);
            }
            if (plan.inserts.length) {
                const { error } = await supabaseClient.from("itinerary_days").insert(plan.inserts);
                if (error) throw error;
                added += plan.inserts.length;
            }
            return { added, updated: updatedIds.size, removed: removedIds.size };
        } catch (error) {
            // Another client may have filled the same dates after our initial read.
            if (attempt === 0 && error && typeof error === "object" && "code" in error && error.code === "23505") continue;
            throw error;
        }
    }
    throw new Error("日程同步發生衝突，請重新同步。");
}

export async function syncTripItineraryDays(trip: TripRow): Promise<SyncResult> {
    // Serialize automatic and manual syncs for the same trip in this client.
    const previous = syncQueues.get(trip.id) ?? Promise.resolve();
    const task = previous.catch(() => undefined).then(() => performSync(trip));
    syncQueues.set(trip.id, task);
    try {
        return await task;
    } finally {
        if (syncQueues.get(trip.id) === task) syncQueues.delete(trip.id);
    }
}
