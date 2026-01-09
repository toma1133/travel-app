import { useOutletContext, useParams } from "react-router-dom";
import { Calendar } from "lucide-react";
import type BookLayoutContextType from "../../models/types/BookLayoutContextTypes";
import type { TripVM } from "../../models/types/TripTypes";

type CoverPageProps = {
    isPrinting?: boolean;
    tripDataOverride?: TripVM;
    tripIdOverride?: string;
};

const CoverPage = ({
    isPrinting,
    tripDataOverride,
    tripIdOverride,
}: CoverPageProps) => {
    const { id: paramsId } = useParams<{ id: string }>();
    const tripId = tripIdOverride || paramsId;
    const contextData = useOutletContext<BookLayoutContextType | null>();
    const tripData = tripDataOverride || contextData?.tripData;

    return (
        <div
            className={`relative flex flex-col w-full ${
                isPrinting ? "h-full bg-white" : "h-full bg-[#2C3E50]"
            }`}
        >
            {/* 封面圖區域 */}
            <div
                className={`relative w-full overflow-hidden ${
                    isPrinting ? "h-[45%]" : "h-[65%]"
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
            <div
                className={`flex-1 relative z-10 flex flex-col ${
                    isPrinting ? "px-8" : "px-8 -mt-20"
                }`}
            >
                <div
                    className={`
                        flex flex-col relative h-full w-full
                        ${
                            isPrinting
                                ? "bg-white pt-4 text-center"
                                : "bg-[#F9F8F6] p-8 shadow-2xl rounded-t-sm"
                        }
                    `}
                >
                    {!isPrinting && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#8E354A]"></div>
                    )}

                    {/* 加入 flex-col justify-center 讓內容垂直置中分布 */}
                    <div className="text-center flex-1 flex flex-col justify-center">
                        {/* <div className="text-center flex-1"> */}
                        <div>
                            <span
                                className={`inline-block px-3 py-1 ${tripData?.theme_config?.accent} text-white text-[10px] tracking-widest mb-4 print:text-black print:bg-transparent print:border print:border-gray-300`}
                            >
                                TRAVEL ITINERARY
                            </span>
                        </div>
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
                    <div className="flex items-center justify-center space-x-6 text-xs text-gray-500 border-t border-gray-200 pt-4 mt-4 mb-4 print:text-sm print:border-gray-300">
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
