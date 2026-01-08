import { useOutletContext, useParams } from "react-router-dom";
import { Calendar } from "lucide-react";
import type BookLayoutContextType from "../../models/types/BookLayoutContextTypes";
import type { TripVM } from "../../models/types/TripTypes";

type CoverPageProps = {
    isPrinting?: boolean;
    tripDataOverride?: TripVM;
    tripIdOverride?: string;
};

const CoverPage = ({ isPrinting, tripDataOverride, tripIdOverride }: CoverPageProps) => {
    const { id: paramsId } = useParams<{ id: string }>();
    const tripId = tripIdOverride || paramsId;
    const contextData = useOutletContext<BookLayoutContextType | null>();
    const tripData = tripDataOverride || contextData?.tripData;

    return (
        <div
            className={`relative flex flex-col w-full ${
                isPrinting
                    ? "h-[1000px] break-after-page bg-white" // 列印: 固定一個 A4 高度或自動，確保分頁
                    : "h-full bg-[#2C3E50]" // 螢幕: 滿版深色
            }`}
        >
            {/* 封面圖區域 */}
            <div
                className={`relative w-full overflow-hidden ${
                    isPrinting ? "h-[500px]" : "h-[65%]"
                }`}
            >
                {tripData?.cover_image && (
                    <img
                        src={tripData.cover_image}
                        alt="Cover"
                        className="w-full h-full object-cover opacity-80"
                        // 列印時不需要 opacity-80，保持原圖清晰
                        style={{ opacity: isPrinting ? 1 : 0.8 }}
                    />
                )}
                {!isPrinting && (
                    <div className="absolute inset-0 bg-linear-to-t from-[#2C3E50] via-transparent to-transparent"></div>
                )}
                {/* <div className="absolute top-10 right-8 flex flex-col items-center space-y-4 opacity-70">
                    <div className="writing-vertical text-white text-lg font-[Noto_Sans_TC] tracking-widest border-r border-white/50 pr-3 h-32">
                        {tripData?.cover_text}
                    </div>
                </div> */}
            </div>
            {/* 內容卡片區域 */}
            <div className={`flex-1 relative z-10 ${isPrinting ? "px-0 -mt-0" : "px-8 -mt-20"}`}>
                <div className={`
                        flex flex-col relative h-full
                        ${isPrinting 
                            ? "bg-white p-8 pt-12 text-center"  // 列印: 白底、置中、無陰影、無圓角
                            : "bg-[#F9F8F6] p-8 shadow-2xl rounded-t-sm" // 螢幕: 卡片感
                        }
                    `}>
                    {/* 裝飾線條 */}
                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#8E354A] ${isPrinting ? "mt-8" : ""}`}></div>
                    <div className="mt-4 text-center">
                        <span
                            className={`inline-block px-3 py-1 ${tripData?.theme_config?.accent} text-white text-[10px] tracking-widest mb-4 print:text-black print:bg-transparent print:border print:border-gray-300`}
                        >
                            TRAVEL ITINERARY
                        </span>
                        <h1
                            className={`text-3xl font-[Noto_Sans_TC] font-bold ${tripData?.theme_config?.primary} mb-2 print:text-4xl print:text-black`}
                        >
                            {tripData?.title}
                        </h1>
                        <p
                            className={`text-sm ${tripData?.theme_config?.subtle} font-medium mb-6 uppercase tracking-widest print:text-gray-600`}
                        >
                            {tripData?.subtitle}
                        </p>
                    </div>
                    {/* 日期與地點資訊 */}
                    <div className="flex items-center justify-center space-x-6 text-xs text-gray-500 border-t border-gray-200 pt-6 mt-6 mb-6 print:text-sm print:border-gray-300">
                        <div className="flex items-center gap-2">
                            <Calendar size={isPrinting ? 16 : 14} />
                            <span>
                                {tripData?.start_date} ~ {tripData?.end_date}
                            </span>
                        </div>
                    </div>
                    <p
                        className={`text-sm ${tripData?.theme_config?.primary} leading-loose text-justify font-light opacity-90 print:text-gray-800 print:text-base print:leading-8 print:px-8`}
                    >
                        {tripData?.description}
                    </p>
                </div>
            </div>
            <style>{`.writing-vertical { writing-mode: vertical-rl; }`}</style>
        </div>
    );
};

export default CoverPage;
