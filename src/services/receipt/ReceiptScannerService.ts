import type { ParsedReceiptData, ReceiptLineItem, ReceiptScanOptions } from "../../models/types/ReceiptScannerTypes";

/**
 * 根據品項名稱推測分類
 */
export function guessCategoryByName(name: string): string {
    const lower = name.toLowerCase();
    if (/(咖啡|拿鐵|紅茶|綠茶|點心|甜點|蛋糕|抹茶|珍珠|麵包|cafe|coffee|tea|dessert|bakery)/i.test(lower)) {
        return "cafe";
    }
    if (/(定食|拉麵|壽司|燒肉|便當|火鍋|餐|飯|麵|居酒屋|串燒|麥當勞|肯德基|丼|beer|food|meal|dinner|lunch|breakfast)/i.test(lower)) {
        return "food";
    }
    if (/(車票|地鐵|巴士|電車|計程車|suica|pasmo|icoca|ticket|train|bus|metro|taxi)/i.test(lower)) {
        return "transport";
    }
    if (/(門票|入場券|展覽|影城|水族館|迪士尼|環球|museum|aquarium|park)/i.test(lower)) {
        return "ticket";
    }
    if (/(藥妝|面膜|合利他命|eve|保養|伴手禮|餅乾|巧克力|衣服|襯衫|免稅|duty\s*free|donki|唐吉訶德|松本清|uniqlo|gu)/i.test(lower)) {
        return "shopping";
    }
    return "shopping"; // 預設多數收據為購物
}

class ReceiptScannerService {
    /**
     * 從 .env 環境變數取得 Gemini API Key (GEMINI_API_KEY 或 VITE_GEMINI_API_KEY)
     */
    getApiKey(): string {
        const envKey =
            (import.meta as any).env?.GEMINI_API_KEY ||
            (import.meta as any).env?.VITE_GEMINI_API_KEY ||
            "";
        return typeof envKey === "string" ? envKey.trim() : "";
    }

    /**
     * 向後相容方法：從環境變數取得 API Key
     */
    getStoredApiKey(): string {
        return this.getApiKey();
    }

    /**
     * 將 Blob / File 轉為 base64 字串（不含 data: 前綴）
     */
    private async blobToBase64(blob: Blob): Promise<{ base64: string; mimeType: string }> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                const match = result.match(/^data:(.+?);base64,(.+)$/);
                if (match) {
                    resolve({ mimeType: match[1], base64: match[2] });
                } else {
                    resolve({ mimeType: blob.type || "image/jpeg", base64: result.split(",")[1] || "" });
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * 掃描收據影像：優先使用 Gemini Vision，失敗或無 Key 則使用高擬真模擬解析
     */
    async scanReceipt(
        imageBlob: Blob,
        options?: ReceiptScanOptions
    ): Promise<ParsedReceiptData> {
        const apiKey = options?.apiKey || this.getStoredApiKey();
        const tripCurrency = options?.tripCurrency || "JPY";
        const allMemberIds = options?.allMemberIds || [];

        if (apiKey) {
            try {
                const cloudResult = await this.scanWithGeminiVision(imageBlob, apiKey, tripCurrency, allMemberIds);
                if (cloudResult && cloudResult.items.length > 0) {
                    return cloudResult;
                }
            } catch (err) {
                console.warn("[ReceiptScanner] Gemini Vision API 辨識異常，切換至本地智能解析模式:", err);
            }
        }

        // 本地智慧解析模式（無 Key 或 API 調用失敗時）
        return this.scanWithLocalEngine(imageBlob, tripCurrency, allMemberIds);
    }

    /**
     * 透過 Gemini 1.5 Flash / 2.0 Flash 進行結構化收據解析
     */
    private async scanWithGeminiVision(
        imageBlob: Blob,
        apiKey: string,
        fallbackCurrency: string,
        allMemberIds: string[]
    ): Promise<ParsedReceiptData> {
        const { base64, mimeType } = await this.blobToBase64(imageBlob);

        const prompt = `You are an expert OCR receipt parser for travelers. Analyze this receipt or invoice image.
Extract the following information as strict JSON (no markdown ticks or extra explanations):
{
  "store_name": "Store name on receipt or 'Unknown Store'",
  "date": "YYYY-MM-DD if found, otherwise today's date",
  "currency": "Standard 3-letter currency code (e.g. JPY, TWD, USD, EUR, KRW) found on receipt, default ${fallbackCurrency}",
  "total_amount": 0, // total sum indicated on receipt
  "items": [
    {
      "name": "Line item product or service name",
      "amount": 0, // total amount for this line
      "quantity": 1,
      "category": "one of: food, shopping, transport, ticket, cafe, other"
    }
  ]
}
Ensure amounts are positive numbers. Extract all legible line items.`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: prompt },
                                {
                                    inline_data: {
                                        mime_type: mimeType,
                                        data: base64,
                                    },
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.1,
                        responseMimeType: "application/json",
                    },
                }),
            }
        );

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Gemini API Error: ${response.status} ${errText}`);
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
            throw new Error("Gemini returned empty text");
        }

        // Clean JSON if needed
        const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();
        const parsed = JSON.parse(cleanedText);

        const items: ReceiptLineItem[] = (parsed.items || []).map((item: any) => ({
            id: crypto.randomUUID(),
            name: item.name || "消費項目",
            amount: Number(item.amount) || 0,
            quantity: Number(item.quantity) || 1,
            category: item.category || guessCategoryByName(item.name || ""),
            split_with: [...allMemberIds],
            is_payer_included: true,
            selected: true,
        }));

        const calculatedSum = items.reduce((sum, item) => sum + item.amount, 0);

        return {
            store_name: parsed.store_name || "收據店家",
            date: parsed.date || new Date().toISOString().split("T")[0],
            currency: parsed.currency || fallbackCurrency,
            total_amount: Number(parsed.total_amount) || calculatedSum,
            items,
            source: "gemini_vision",
            confidence: 0.95,
        };
    }

    /**
     * 未設定 API Key 或未抓到品項時之乾淨狀態（不預設填入範本資料）
     */
    private scanWithLocalEngine(
        _imageBlob: Blob,
        currency: string,
        _allMemberIds: string[]
    ): ParsedReceiptData {
        const todayStr = new Date().toISOString().split("T")[0];

        return {
            store_name: "",
            date: todayStr,
            currency: currency,
            total_amount: 0,
            items: [],
            source: "manual",
            confidence: 0,
        };
    }
}

export const ReceiptScanner = new ReceiptScannerService();
