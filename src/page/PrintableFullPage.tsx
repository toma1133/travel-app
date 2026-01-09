import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useIsFetching } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import CoverPage from "./Book/CoverPage";
import GuidePage from "./Book/GuidePage";
import ItineraryPage from "./Book/ItineraryPage";
import BudgetPage from "./Book/BudgetPage";
import InfoPage from "./Book/InfoPage";
import type { TripVM } from "../models/types/TripTypes";

type PrintableFullPageProps = {
    tripData?: TripVM;
    onPrintComplete?: () => void;
};

const PrintableFullPage = ({
    tripData,
    onPrintComplete,
}: PrintableFullPageProps) => {
    const tripId = tripData?.id;
    const isFetching = useIsFetching();
    const [isDataReady, setIsDataReady] = useState(false);
    const [isImagesLoaded, setIsImagesLoaded] = useState(false);
    // 1. 等待 API 資料
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isFetching === 0) setIsDataReady(true);
        }, 1000); // 稍微加長一點緩衝
        return () => clearTimeout(timer);
    }, [isFetching]);

    // 2. 等待圖片載入
    useEffect(() => {
        if (!isDataReady) return;
        const checkImages = () => {
            const images = Array.from(document.images);
            const promises = images.map((img) => {
                if (img.complete) return Promise.resolve();
                return new Promise((resolve) => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
            });
            Promise.all(promises).then(() =>
                setTimeout(() => setIsImagesLoaded(true), 500)
            );
        };
        checkImages();
    }, [isDataReady]);

    // 3. 觸發列印
    useEffect(() => {
        if (isDataReady && isImagesLoaded) {
            window.print();
        }
    }, [isDataReady, isImagesLoaded]);

    // 內容 JSX
    const content = (
        <>
            {/* [新增] 全域樣式修正：列印時隱藏原本的 App root，並修正 body 滾動 */}
            <style>{`
                @media print {
                    #root { display: none !important; }
                    html, body {
                        height: auto !important;
                        overflow: visible !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        -webkit-print-color-adjust: exact; /* 強制 Safari 印出背景色 */
                    }
                    
                    /* [關鍵修正 1] 定義強制的換頁 Class */
                    .print-section-break {
                        page-break-before: always !important; /* Safari/WebKit 舊版語法 */
                        break-before: page !important;        /* 標準語法 */
                        display: block !important;            /* 確保 block 佈局 */
                        
                        /* [關鍵修正 2] 移除 Margin,避免換頁後上方出現空白 */
                        margin-top: 0 !important;
                        padding-top: 20px; /* 如果需要一點緩衝，用 padding */
                    }
                    
                    /* 避免內容被切斷 */
                    .avoid-break {
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                }
            `}</style>

            {/* 外層容器 */}
            <div
                className={`
                    /* --- 螢幕模式 (Preview) --- */
                    fixed inset-0 z-[9999] bg-white overflow-y-auto 
                    
                    /* --- 列印模式 (Print) --- */
                    /* 關鍵修正：列印時解除 fixed，改為 absolute 蓋在最上面 */
                    print:absolute print:inset-0 print:z-[9999]
                    /* 關鍵修正：讓高度自動延伸，允許內容撐開頁面 */
                    print:h-auto print:overflow-visible
                    /* 確保背景白紙黑字 */
                    print:bg-white
                `}
            >
                {/* Loading 遮罩 */}
                {(!isDataReady || !isImagesLoaded) && (
                    <div className="fixed inset-0 z-[10000] bg-white flex flex-col items-center justify-center">
                        <Loader2
                            size={48}
                            className="animate-spin text-gray-400 mb-4"
                        />
                        <p className="text-gray-500 font-bold animate-pulse">
                            {!isDataReady
                                ? "正在彙整行程資料..."
                                : "正在渲染圖片..."}
                        </p>
                    </div>
                )}

                {/* 離開按鈕 (列印隱藏) */}
                <div className="fixed top-6 right-6 z-[60] print:hidden">
                    <button
                        type="button"
                        onClick={onPrintComplete}
                        className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-full shadow-xl hover:bg-black transition-all font-bold text-sm"
                    >
                        <X size={18} />
                        關閉預覽
                    </button>
                </div>

                {/* A4 內容容器 */}
                <div
                    className={`
                    bg-white text-black min-h-screen w-full p-8 max-w-[210mm] mx-auto 
                    
                    /* 列印時移除 padding 與最大寬度限制，讓瀏覽器控制 */
                    print:p-0 print:max-w-none print:w-full
                `}
                >
                    <CoverPage
                        isPrinting={true}
                        tripDataOverride={tripData}
                        tripIdOverride={tripId}
                    />

                    {/* [關鍵修正 3] 應用新的 Class，並移除 mt-8 */}
                    <div className="mt-8 print:mt-0 print-section-break">
                        <h3 className="text-lg font-[Noto_Sans_TC] font-bold mb-4">
                            行程表
                        </h3>
                        <ItineraryPage
                            isPrinting={true}
                            tripDataOverride={tripData}
                            tripIdOverride={tripId}
                        />
                    </div>
                    <div className="mt-8 print:mt-0 print-section-break">
                        <h3 className="text-lg font-[Noto_Sans_TC] font-bold mb-4">
                            消費總覽
                        </h3>
                        <BudgetPage
                            isPrinting={true}
                            tripDataOverride={tripData}
                            tripIdOverride={tripId}
                        />
                    </div>
                    <div className="mt-8 print:mt-0 print-section-break">
                        <h3 className="text-lg font-[Noto_Sans_TC] font-bold mb-4">
                            景點誌
                        </h3>
                        <GuidePage
                            isPrinting={true}
                            tripDataOverride={tripData}
                            tripIdOverride={tripId}
                        />
                    </div>
                    <div className="mt-8 print:mt-0 print-section-break">
                        <h3 className="text-lg font-[Noto_Sans_TC] font-bold mb-4">
                            預訂資訊
                        </h3>
                        <InfoPage
                            isPrinting={true}
                            tripDataOverride={tripData}
                            tripIdOverride={tripId}
                        />
                    </div>
                </div>
            </div>
        </>
    );

    // [關鍵] 使用 createPortal 將內容渲染到 body，跳脫 ProtectedLayout
    return createPortal(content, document.body);
};

export default PrintableFullPage;
