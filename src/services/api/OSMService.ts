export type OSMPlace = {
    place_id: number;
    name: string;
    display_name: string;
    lat: string;
    lon: string;
    extratags?: {
        opening_hours?: string;
        website?: string;
        wikipedia?: string;
        wikidata?: string;
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

export class OSMService {
    /**
     * Search for places using OpenStreetMap Nominatim API
     */
    static async searchPlaces(query: string): Promise<OSMPlace[]> {
        if (!query.trim()) return [];

        try {
            // Using a generic email for nominatim usage policy
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
                    query
                )}&format=json&extratags=1&addressdetails=1&limit=5&email=travel-app-demo@example.com`,
                {
                    headers: {
                        "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7",
                    },
                }
            );

            if (!response.ok) {
                console.error("Nominatim API Error:", response.status);
                return [];
            }

            const data = await response.json();
            return data as OSMPlace[];
        } catch (error) {
            console.error("Error searching OSM:", error);
            return [];
        }
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
