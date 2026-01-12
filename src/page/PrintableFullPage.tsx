import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useIsFetching } from "@tanstack/react-query";
import { Info, Loader2, Map, Pin, Wallet, X } from "lucide-react";
import CoverPage from "./Book/CoverPage";
import GuidePage from "./Book/GuidePage";
import ItineraryPage from "./Book/ItineraryPage";
import BudgetPage from "./Book/BudgetPage";
import InfoPage from "./Book/InfoPage";
import type { TripVM } from "../models/types/TripTypes";

type PrintableFullPageProps = {
    tripData?: TripVM;
    onClose: () => void;
};

const PageBreak = () => (
    <div
        className="hidden block"
        style={{
            pageBreakBefore: "always",
            breakBefore: "page",
            height: "0",
            width: "100%",
            visibility: "hidden",
        }}
    />
);

const PrintableFullPage = ({ tripData, onClose }: PrintableFullPageProps) => {
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
                #root { display: none !important; }

                @media print {
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
                    fixed inset-0 z-9999 bg-gray-100 overflow-y-auto 
                    static inset-auto h-auto overflow-visible block bg-white w-full
                `}
            >
                {/* Loading 遮罩 */}
                {(!isDataReady || !isImagesLoaded) && (
                    <div className="fixed inset-0 z-10000 bg-white flex flex-col items-center justify-center">
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

                <div className="flex items-center gap-3 fixed top-6 right-6 z-60 print:hidden">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-full shadow-xl hover:bg-black transition-all font-bold text-sm"
                    >
                        <X size={18} />
                        關閉預覽
                    </button>
                </div>

                {/* --- 主要內容區 (A4 預覽) --- */}
                <div
                    className={`
                            bg-white text-black min-h-screen w-full mx-auto 
                            max-w-[210mm] shadow-2xl
                            shadow-none m-0 p-0 max-w-none w-full
                        `}
                >
                    <div
                        className={`
                                w-full block relative mb-0
                                aspect-210/297 overflow-hidden
                                aspect-auto 
                                h-[297mm] 
                                overflow-visible
                                break-after-page 
                                m-0
                            `}
                    >
                        <CoverPage
                            isPrinting={true}
                            tripDataOverride={tripData}
                            tripIdOverride={tripId}
                        />
                    </div>
                    <div className="pt-4 block page-content-wrapper px-8">
                        <div className="mb-8 border-b-4 border-black pb-4 flex justify-between items-end">
                            <div>
                                <h1 className="text-4xl font-black text-black uppercase tracking-tighter">
                                    Itinerary
                                </h1>
                                <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1"></p>
                            </div>
                            <Map size={32} className="text-gray-300 mb-1" />
                        </div>
                        <ItineraryPage
                            isPrinting={true}
                            tripDataOverride={tripData}
                            tripIdOverride={tripId}
                        />
                    </div>

                    <PageBreak />

                    <div className="pt-4 block page-content-wrapper px-8">
                        <div className="mb-8 border-b-4 border-black pb-4 flex justify-between items-end">
                            <div>
                                <h1 className="text-4xl font-black text-black uppercase tracking-tighter">
                                    Tranactions
                                </h1>
                                <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1"></p>
                            </div>
                            <Wallet size={32} className="text-gray-300 mb-1" />
                        </div>
                        <BudgetPage
                            isPrinting={true}
                            tripDataOverride={tripData}
                            tripIdOverride={tripId}
                        />
                    </div>

                    <PageBreak />

                    <div className="pt-4 block page-content-wrapper px-8">
                        <div className="mb-8 border-b-4 border-black pb-4 flex justify-between items-end">
                            <div>
                                <h1 className="text-4xl font-black text-black uppercase tracking-tighter">
                                    Places
                                </h1>
                                <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">
                                    Scene / Restaurant / Shop / Hotel
                                </p>
                            </div>
                            <Pin size={32} className="text-gray-300 mb-1" />
                        </div>
                        <GuidePage
                            isPrinting={true}
                            tripDataOverride={tripData}
                            tripIdOverride={tripId}
                        />
                    </div>

                    <PageBreak />

                    <div className="pt-4 block page-content-wrapper px-8">
                        <div className="mb-8 border-b-4 border-black pb-4 flex justify-between items-end">
                            <div>
                                <h1 className="text-4xl font-black text-black uppercase tracking-tighter">
                                    Reservations
                                </h1>
                                <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">
                                    Flight / Hotel / Transport
                                </p>
                            </div>
                            <Info size={32} className="text-gray-300 mb-1" />
                        </div>
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
