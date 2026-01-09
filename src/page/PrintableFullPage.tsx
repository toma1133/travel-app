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

const PageBreak = () => (
    <div
        className="hidden print:block"
        style={{
            pageBreakBefore: "always",
            breakBefore: "page",
            height: "0",
            width: "100%",
            visibility: "hidden",
        }}
    />
);

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

                    @page {
                        margin-top: 10mm;
                        margin-bottom: 10mm;
                        margin-left: 0mm;
                        margin-right: 0mm;
                        size: auto; 
                    }
                    
                    @page :first {
                        margin: 0mm;
                    }
                        
                    html, body {
                        width: 100%;
                        height: 100%;
                        overflow: visible !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        display: block !important; /* 關鍵：防止 Flex 干擾 */
                    }

                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    h3 {
                        margin-top: 0 !important;
                        padding-top: 0 !important;
                    }

                    .page-content-wrapper {
                        padding-top: 20px;
                    }
                }
            `}</style>

            {/* 外層容器 */}
            <div
                className={`
                    fixed inset-0 z-[9999] bg-gray-100 overflow-y-auto 
                    print:static print:inset-auto print:h-auto print:overflow-visible print:block print:bg-white print:w-full
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
                        bg-white text-black min-h-screen w-full mx-auto 
                        max-w-[210mm] p-8 shadow-2xl my-8
                        print:shadow-none print:m-0 print:p-0 print:max-w-none print:w-full
                    `}
                >
                    <div
                        className={`
                            print:block print:w-full print:aspect-[210/297] print:overflow-hidden print:break-after-page print:-m-0
                        `}
                    >
                        <CoverPage
                            isPrinting={true}
                            tripDataOverride={tripData}
                            tripIdOverride={tripId}
                        />
                    </div>

                    <div className="pt-8 print:pt-4 print:block page-content-wrapper print:px-8">
                        <h3 className="text-lg font-[Noto_Sans_TC] font-bold mb-4">
                            行程表
                        </h3>
                        <ItineraryPage
                            isPrinting={true}
                            tripDataOverride={tripData}
                            tripIdOverride={tripId}
                        />
                    </div>

                    <PageBreak />

                    <div className="pt-8 print:pt-4 print:block page-content-wrapper print:px-8">
                        <h3 className="text-lg font-[Noto_Sans_TC] font-bold mb-4">
                            消費總覽
                        </h3>
                        <BudgetPage
                            isPrinting={true}
                            tripDataOverride={tripData}
                            tripIdOverride={tripId}
                        />
                    </div>

                    <PageBreak />

                    <div className="pt-8 print:pt-4 print:block page-content-wrapper print:px-8">
                        <h3 className="text-lg font-[Noto_Sans_TC] font-bold mb-4">
                            景點誌
                        </h3>
                        <GuidePage
                            isPrinting={true}
                            tripDataOverride={tripData}
                            tripIdOverride={tripId}
                        />
                    </div>

                    <PageBreak />

                    <div className="pt-8 print:pt-4 print:block page-content-wrapper print:px-8">
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
