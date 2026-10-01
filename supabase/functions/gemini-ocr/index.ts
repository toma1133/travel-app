import { buildReceiptPrompt } from "./receiptPrompt.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
    // 處理 CORS Preflight 請求
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const apiKey = Deno.env.get("GEMINI_API_KEY");
        if (!apiKey) {
            return new Response(
                JSON.stringify({
                    error: "GEMINI_API_KEY is not set in Supabase Secrets.",
                }),
                {
                    status: 500,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                },
            );
        }

        const body = await req.json();
        const {
            base64,
            mimeType = "image/jpeg",
            fallbackCurrency = "JPY",
            knownStores = [],
            model = "gemini-2.0-flash-lite",
        } = body;

        if (!base64) {
            return new Response(
                JSON.stringify({
                    error: "Missing required 'base64' image data in request body.",
                }),
                {
                    status: 400,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                },
            );
        }

        const prompt = buildReceiptPrompt(
            fallbackCurrency,
            Array.isArray(knownStores) ? knownStores.slice(0, 100) : [],
        );

        // 支援多模型備選切換 (優先使用指定的 flash-lite，若失敗自動 fallback 至 1.5-flash / 2.0-flash)
        const candidateModels = [
            model,
            "gemini-3.5-flash-lite",
            "gemini-3.8-flash",
        ];
        const modelsToTry = [...new Set(candidateModels.filter(Boolean))];

        let lastError: string | null = null;
        let parsedResult: any = null;

        for (const m of modelsToTry) {
            try {
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
                const geminiRes = await fetch(apiUrl, {
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
                });

                if (!geminiRes.ok) {
                    const errText = await geminiRes.text();
                    lastError = `Model ${m} failed (${geminiRes.status}): ${errText}`;
                    console.warn(lastError);
                    continue;
                }

                const data = await geminiRes.json();
                const rawText =
                    data?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!rawText) {
                    lastError = `Model ${m} returned empty text`;
                    continue;
                }

                const cleaned = rawText
                    .replace(/```json\n?|\n?```/g, "")
                    .trim();
                parsedResult = JSON.parse(cleaned);
                break;
            } catch (err: any) {
                lastError = err?.message || String(err);
            }
        }

        if (!parsedResult) {
            return new Response(
                JSON.stringify({
                    error:
                        lastError ||
                        "Failed to process receipt with Gemini models.",
                }),
                {
                    status: 502,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                },
            );
        }

        return new Response(
            JSON.stringify({
                success: true,
                data: parsedResult,
            }),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );
    } catch (err: any) {
        return new Response(
            JSON.stringify({
                error: err?.message || "Internal server error",
            }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );
    }
});
