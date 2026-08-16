/**
 * Kakao Local API Service
 * Official Documentation: https://developers.kakao.com/docs/latest/ko/local/dev-guide
 */

export interface KakaoPlace {
    id: string;
    place_name: string;
    category_name: string;
    category_group_code?: string;
    category_group_name?: string;
    phone: string;
    address_name: string;
    road_address_name: string;
    x: string; // Longitude (經度)
    y: string; // Latitude (緯度)
    place_url: string;
    distance?: string;
}

export interface KakaoAddressDoc {
    address_name: string;
    address_type: "REGION" | "ROAD" | "REGION_ADDR" | "ROAD_ADDR";
    x: string; // Longitude (經度)
    y: string; // Latitude (緯度)
    road_address?: {
        address_name: string;
        region_1depth_name: string;
        region_2depth_name: string;
        region_3depth_name: string;
        road_name: string;
        building_name: string;
        zone_no: string;
        x: string;
        y: string;
    } | null;
    address?: {
        address_name: string;
        region_1depth_name: string;
        region_2depth_name: string;
        region_3depth_name: string;
        mountain_yn: string;
        main_address_no: string;
        sub_address_no: string;
        zip_code: string;
        x: string;
        y: string;
    } | null;
}

export class KakaoLocalService {
    /**
     * Get Kakao REST API Key from Vite Environment variables
     */
    static getApiKey(): string | null {
        return import.meta.env.VITE_KAKAO_REST_API_KEY || null;
    }

    /**
     * Check if Kakao API is configured
     */
    static isConfigured(): boolean {
        const key = this.getApiKey();
        return !!(key && key.trim().length > 0);
    }

    /**
     * Clean Korean address before searching
     */
    private static cleanQuery(query: string): string {
        if (!query) return "";
        return query
            .replace(/^(?:도로명|지번|우편번호)\s*/i, "")
            .replace(/\[복사\]/gi, "")
            .replace(/복사/gi, "")
            .trim();
    }

    /**
     * Search by Address (도로명 or 지번) using Kakao Local API
     * Endpoint: /v2/local/search/address.json
     */
    static async searchAddress(query: string): Promise<KakaoAddressDoc[]> {
        const apiKey = this.getApiKey();
        if (!apiKey) return [];

        const cleaned = this.cleanQuery(query);
        if (!cleaned) return [];

        // 移除多餘樓層字眼 (例如: 1,2층, 3층, B1층)
        const withoutFloor = cleaned
            .replace(/\s*(?:B?\d+(?:[,\.]\s*\d+)*층|\d+호|\d+F|\d+階).*$/i, "")
            .trim();

        try {
            const response = await fetch(
                `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(
                    withoutFloor
                )}`,
                {
                    headers: {
                        Authorization: `KakaoAK ${apiKey.trim()}`,
                    },
                }
            );

            if (!response.ok) {
                console.error("Kakao Address API Error:", response.status, response.statusText);
                return [];
            }

            const data = await response.json();
            return (data.documents as KakaoAddressDoc[]) || [];
        } catch (e) {
            console.error("Failed to query Kakao Address API:", e);
            return [];
        }
    }

    /**
     * Search by Keyword / Place Name using Kakao Local API
     * Endpoint: /v2/local/search/keyword.json
     */
    static async searchKeyword(query: string): Promise<KakaoPlace[]> {
        const apiKey = this.getApiKey();
        if (!apiKey) return [];

        const cleaned = this.cleanQuery(query);
        if (!cleaned) return [];

        try {
            const response = await fetch(
                `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(
                    cleaned
                )}&size=10`,
                {
                    headers: {
                        Authorization: `KakaoAK ${apiKey.trim()}`,
                    },
                }
            );

            if (!response.ok) {
                console.error("Kakao Keyword API Error:", response.status, response.statusText);
                return [];
            }

            const data = await response.json();
            return (data.documents as KakaoPlace[]) || [];
        } catch (e) {
            console.error("Failed to query Kakao Keyword API:", e);
            return [];
        }
    }

    /**
     * Unified Geocoder: Tries Address search first, then Keyword search
     */
    static async geocode(query: string): Promise<{
        lat: number;
        lng: number;
        roadAddress?: string;
        jibeonAddress?: string;
        placeName?: string;
        phone?: string;
        category?: string;
        kakaoUrl?: string;
    } | null> {
        if (!this.isConfigured() || !query.trim()) return null;

        // 1. 優先嘗試地址搜尋 (도로명 / 지번)
        const addrResults = await this.searchAddress(query);
        if (addrResults.length > 0) {
            const best = addrResults[0];
            const lat = parseFloat(best.y);
            const lng = parseFloat(best.x);

            if (!isNaN(lat) && !isNaN(lng)) {
                return {
                    lat,
                    lng,
                    roadAddress: best.road_address?.address_name || best.address_name,
                    jibeonAddress: best.address?.address_name,
                };
            }
        }

        // 2. 次之嘗試關鍵字/店名搜尋 (如 "에그드랍 남포동점")
        const keywordResults = await this.searchKeyword(query);
        if (keywordResults.length > 0) {
            const best = keywordResults[0];
            const lat = parseFloat(best.y);
            const lng = parseFloat(best.x);

            if (!isNaN(lat) && !isNaN(lng)) {
                return {
                    lat,
                    lng,
                    roadAddress: best.road_address_name || best.address_name,
                    jibeonAddress: best.address_name,
                    placeName: best.place_name,
                    phone: best.phone,
                    category: best.category_name,
                    kakaoUrl: best.place_url,
                };
            }
        }

        return null;
    }
}
