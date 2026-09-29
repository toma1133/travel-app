/**
 * 集中管理的 TanStack Query Key 工廠
 * 提供型別安全且一致的快取鍵管理，支援階層式快取無效化與細粒度快取更新。
 */

export const QUERY_KEYS = {
    // Trips
    trips: {
        all: ["trips"] as const,
        list: (userId?: string) => ["trips", userId] as const,
        detail: (tripId?: string) => ["trip", tripId] as const,
    },

    // Itineraries
    itineraries: {
        all: ["itinerary_days"] as const,
        list: (tripId?: string) => ["itinerary_days", tripId] as const,
        detail: (id?: string) => ["itinerary_day", id] as const,
    },

    // Places
    places: {
        all: ["places"] as const,
        list: (tripId?: string) => ["places", tripId] as const,
        detail: (placeId?: string) => ["place", placeId] as const,
        batch: (tripId: string, placeIds: string[]) =>
            ["places", tripId, "batch", [...placeIds].sort().join(",")] as const,
    },

    // Shopping
    shopping: {
        all: ["shopping_items"] as const,
        list: (tripId?: string) => ["shopping_items", tripId] as const,
        detail: (itemId?: string) => ["shopping_item", itemId] as const,
    },

    // Budget / Transactions
    budget: {
        all: ["budget_items"] as const,
        list: (tripId?: string, userId?: string) =>
            ["budget_items", tripId, userId] as const,
        detail: (id?: string) => ["budget_item", id] as const,
        paymentMethods: (tripId?: string) =>
            ["payment_methods", tripId] as const,
    },

    // Weather
    weather: {
        all: ["weather"] as const,
        daily: (lat: number, lng: number, dateStr: string) =>
            ["weather", Number(lat.toFixed(4)), Number(lng.toFixed(4)), dateStr] as const,
    },

    // Members & Invitations
    tripMembers: {
        all: ["trip_members"] as const,
        list: (tripId?: string) => ["trip_members", tripId] as const,
        detail: (id?: string) => ["trip_member", id] as const,
    },
    tripInvitations: {
        all: ["trip_invitations"] as const,
        list: (tripId?: string) => ["trip_invitations", tripId] as const,
        myInvitations: (email?: string) => ["my_trip_invitations", email] as const,
    },

    // Profiles
    profiles: {
        all: ["profiles"] as const,
    },
};

/**
 * 依照規格書之相容快捷函式形式
 */
export const queryKeys = {
    trip: (tripId?: string) => QUERY_KEYS.trips.detail(tripId),
    trips: (userId?: string) => (userId ? QUERY_KEYS.trips.list(userId) : QUERY_KEYS.trips.all),
    itineraries: (tripId?: string) => QUERY_KEYS.itineraries.list(tripId),
    places: (tripId?: string) => QUERY_KEYS.places.list(tripId),
    placesBatch: (tripId: string, placeIds: string[]) =>
        QUERY_KEYS.places.batch(tripId, placeIds),
    transactions: (tripId?: string, userId?: string) =>
        QUERY_KEYS.budget.list(tripId, userId),
    shoppingItems: (tripId?: string) => QUERY_KEYS.shopping.list(tripId),
    weather: (lat: number, lng: number, date: string) =>
        QUERY_KEYS.weather.daily(lat, lng, date),
};

export default QUERY_KEYS;
