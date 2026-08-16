export type OSMPlace = {
    place_id: number | string;
    name: string;
    display_name: string;
    lat: string;
    lon: string;
    type?: string;
    class?: string;
    extratags?: {
        opening_hours?: string;
        website?: string;
        wikipedia?: string;
        wikidata?: string;
        "name:en"?: string;
        [key: string]: string | undefined;
    };
    address?: {
        road?: string;
        city?: string;
        town?: string;
        village?: string;
        state?: string;
        country?: string;
    };
};

export type WikiData = {
    extract?: string;
    thumbnailUrl?: string;
    title?: string;
};

/**
 * Sanitizes and generates fallback search queries for Korean / International addresses
 * (Removes Naver prefixes like 도로명, 지번, floors like 1,2층, and copy tags like [복사])
 */
export function cleanAddressQuery(query: string): string[] {
    if (!query || !query.trim()) return [];

    let cleaned = query.trim();

    // 1. 移除 Naver / 地圖常見前綴標籤: 도로명(道路名), 지번(地號), 우편번호(郵遞區號), [복사](複製)
    cleaned = cleaned
        .replace(/^(?:도로명|지번|우편번호)\s*/i, "")
        .replace(/\[복사\]/gi, "")
        .replace(/복사/gi, "")
        .trim();

    // 2. 移除後綴樓層與房號 (例: 1,2층, 3층, B1층, 101호, 202호, 3F, 1.2층)
    // ⚠️ 樓層文字 (如 2층) 絕不可送入 Nominatim 搜尋，否則會誤比對到遠方包含「2층」名稱的建築物
    const withoutFloor = cleaned
        .replace(/\s*(?:B?\d+(?:[,\.]\s*\d+)*층|\d+호|\d+F|\d+階).*$/i, "")
        .trim();

    // 3. 移除細部門牌號以獲得道路/街區名 (例: "부산 중구 광복로 83-1" -> "부산 중구 광복로")
    const withoutHouseNumber = withoutFloor
        .replace(/\s+\d+(?:-\d+)?$/i, "")
        .trim();

    const candidates = [withoutFloor, withoutHouseNumber].filter(
        (v, i, arr) => v && arr.indexOf(v) === i
    );

    return candidates;
}

export class OSMService {
    /**
     * Search for places using OpenStreetMap Nominatim API with automatic address sanitization
     */
    static async searchPlaces(query: string): Promise<OSMPlace[]> {
        if (!query.trim()) return [];

        const candidateQueries = cleanAddressQuery(query);
        if (candidateQueries.length === 0) candidateQueries.push(query.trim());

        for (const candidate of candidateQueries) {
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
                        candidate
                    )}&format=json&extratags=1&addressdetails=1&limit=5&email=travel-app-demo@example.com`,
                    {
                        headers: {
                            "Accept-Language": "zh-TW,zh;q=0.9,ja;q=0.8,ko;q=0.8,en-US;q=0.7,en;q=0.6",
                            "User-Agent": "TravelAppDemo/1.0",
                        },
                    }
                );

                if (!response.ok) {
                    console.error("Nominatim API Error:", response.status);
                    continue;
                }

                const data = (await response.json()) as OSMPlace[];
                if (Array.isArray(data) && data.length > 0) {
                    return data;
                }
            } catch (error) {
                console.error(`Error searching OSM for "${candidate}":`, error);
            }
        }

        return [];
    }

    /**
     * Fetch rich data from Wikipedia if the OSM place has a wikipedia tag
     * e.g., extratags.wikipedia = "en:Kiyomizu-dera" or "zh:清水寺"
     */
    static async getWikiData(wikiTag: string): Promise<WikiData | null> {
        try {
            const parts = wikiTag.split(":");
            if (parts.length < 2) return null;

            const lang = parts[0];
            const title = parts.slice(1).join(":"); // In case title has colons

            const url = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages&titles=${encodeURIComponent(
                title
            )}&format=json&exintro=1&explaintext=1&pithumbsize=800&origin=*`;

            const response = await fetch(url);
            if (!response.ok) return null;

            const data = await response.json();
            const pages = data.query?.pages;
            
            if (!pages) return null;

            // Get the first page object (the key is the page ID)
            const pageId = Object.keys(pages)[0];
            const page = pages[pageId];

            if (!page || pageId === "-1") return null;

            return {
                extract: page.extract,
                thumbnailUrl: page.thumbnail?.source,
                title: page.title,
            };
        } catch (error) {
            console.error("Error fetching Wiki data:", error);
            return null;
        }
    }
}
