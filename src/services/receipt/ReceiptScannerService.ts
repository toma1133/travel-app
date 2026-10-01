import type {
    ParsedReceiptData,
    ReceiptScanOptions,
} from "../../models/types/ReceiptScannerTypes";
import { buildReceiptPrompt } from "../../../supabase/functions/gemini-ocr/receiptPrompt";
import { normalizeReceipt } from "./ReceiptParser";
export { guessCategoryByName } from "./ReceiptParser";
import { supabaseClient } from "../SupabaseClient";

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
    private async blobToBase64(
        blob: Blob,
    ): Promise<{ base64: string; mimeType: string }> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                const match = result.match(/^data:(.+?);base64,(.+)$/);
                if (match) {
                    resolve({ mimeType: match[1], base64: match[2] });
                } else {
                    resolve({
                        mimeType: blob.type || "image/jpeg",
                        base64: result.split(",")[1] || "",
                    });
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * 掃描收據影像：優先使用 Supabase Edge Function (後端安全代理)，次選本地 API Key，最後 fallback 本地引擎
     */
    async scanReceipt(
        imageBlob: Blob,
        options?: ReceiptScanOptions,
    ): Promise<ParsedReceiptData> {
        const apiKey = options?.apiKey || this.getStoredApiKey();
        const tripCurrency = options?.tripCurrency || "JPY";
        const allMemberIds = options?.allMemberIds || [];
        const knownStores = options?.knownStores || [];

        // 1. 優先嘗試呼叫 Supabase Edge Function (後端代理模式，金鑰安全不落地)
        try {
            const edgeResult = await this.scanWithEdgeFunction(
                imageBlob,
                tripCurrency,
                allMemberIds,
                knownStores,
            );
            if (
                edgeResult &&
                (edgeResult.items.length > 0 || edgeResult.total_amount > 0)
            ) {
                return edgeResult;
            }
        } catch (edgeErr) {
            console.warn(
                "[ReceiptScanner] Supabase Edge Function 調用異常，切換至備援模式:",
                edgeErr,
            );
        }

        // 2. 若本地有設定 API Key，嘗試前端直連 Gemini Vision
        if (apiKey) {
            try {
                const cloudResult = await this.scanWithGeminiVision(
                    imageBlob,
                    apiKey,
                    tripCurrency,
                    allMemberIds,
                    knownStores,
                );
                if (
                    cloudResult &&
                    (cloudResult.items.length > 0 ||
                        cloudResult.total_amount > 0)
                ) {
                    return cloudResult;
                }
            } catch (err) {
                console.warn(
                    "[ReceiptScanner] Gemini Vision API 辨識異常，切換至本地智能解析模式:",
                    err,
                );
            }
        }

        // 3. 本地智慧解析模式（無 Key 或 API 調用失敗時）
        return this.scanWithLocalEngine(imageBlob, tripCurrency, allMemberIds);
    }

    /**
     * 透過 Supabase Edge Function 呼叫後端代理解析收據
     */
    private async scanWithEdgeFunction(
        imageBlob: Blob,
        fallbackCurrency: string,
        allMemberIds: string[],
        knownStores: NonNullable<ReceiptScanOptions["knownStores"]>,
    ): Promise<ParsedReceiptData | null> {
        const { base64, mimeType } = await this.blobToBase64(imageBlob);

        const { data, error } = await supabaseClient.functions.invoke(
            "gemini-ocr",
            {
                body: {
                    base64,
                    mimeType,
                    fallbackCurrency,
                    knownStores,
                    model: "gemini-2.0-flash-lite",
                },
            },
        );

        if (error) {
            console.warn("[ReceiptScanner] Edge Function 回應錯誤:", error);
            return null;
        }

        const parsed = data?.data;
        if (!parsed) return null;

        return normalizeReceipt(parsed, fallbackCurrency, allMemberIds);
    }

    /**
     * 透過 Gemini 1.5 Flash / 2.0 Flash 進行結構化收據解析
     */
    private async scanWithGeminiVision(
        imageBlob: Blob,
        apiKey: string,
        fallbackCurrency: string,
        allMemberIds: string[],
        knownStores: NonNullable<ReceiptScanOptions["knownStores"]>,
    ): Promise<ParsedReceiptData> {
        const { base64, mimeType } = await this.blobToBase64(imageBlob);

        const prompt = buildReceiptPrompt(fallbackCurrency, knownStores);

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
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
            },
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

        return normalizeReceipt(parsed, fallbackCurrency, allMemberIds);
    }

    /**
     * 未設定 API Key 或未抓到品項時之乾淨狀態（不預設填入範本資料）
     */
    private scanWithLocalEngine(
        _imageBlob: Blob,
        currency: string,
        _allMemberIds: string[],
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
