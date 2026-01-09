import { useOutletContext, useParams } from "react-router-dom";
import { Calendar, MapPin } from "lucide-react";
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

    const accentColor = tripData?.theme_config?.accent || "bg-rose-600";
    const titleColor = tripData?.theme_config?.primary || "text-gray-900";

    const dayCount =
        tripData?.start_date && tripData?.end_date
            ? Math.max(
                  1,
                  Math.ceil(
                      (new Date(tripData.end_date).getTime() -
                          new Date(tripData.start_date).getTime()) /
                          (1000 * 60 * 60 * 24)
                  ) + 1
              )
            : 1;
    return (
        <div
            className={`
                w-full bg-white overflow-hidden flex flex-col h-full 
                print:h-[98vh] print:max-h-[98vh] 
                print:break-inside-avoid
            `}
        >
            {/* 封面圖區域 */}
            <div
                className={`
                    w-full relative shrink-0
                    flex-1 min-h-[30%] 
                    print:h-[55%] print:flex-none
                `}
            >
                {tripData?.cover_image ? (
                    <img
                        src={tripData.cover_image}
                        alt="Cover"
                        className="w-full h-full object-cover"
                        style={{ opacity: 1 }}
                    />
                ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                        No Cover Image
                    </div>
                )}
                {!isPrinting && (
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/10"></div>
                )}
            </div>
            {/* 內容卡片區域 */}
            <div
                className={`
                    w-full bg-white relative z-10 flex flex-col
                    h-auto shrink-0
                    ${
                        !isPrinting
                            ? "-mt-10 rounded-t-[32px] shadow-[0_-10px_30px_rgba(0,0,0,0.15)]"
                            : "print:mt-0 print:shadow-none print:rounded-none print:border-t-4 print:border-gray-900 print:flex-1"
                    }
                `}
            >
                {/* 螢幕模式：頂部的小橫條 (裝飾用，也可當作 drag handle) */}
                {!isPrinting && (
                    <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-3 mb-1 shrink-0"></div>
                )}
                <div
                    className={`
                        flex flex-col items-start justify-start px-8 py-6
                        ${!isPrinting ? "" : "overflow-hidden"} 
                    `}
                >
                    {/* 上方標籤區 */}
                    <div className="flex items-center gap-3 mb-4 shrink-0">
                        <span
                            className={`px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-white uppercase rounded-full ${accentColor} print:text-white print:bg-black`}
                        >
                            TRAVEL PLAN
                        </span>
                        <span className="text-xs font-bold text-gray-400 tracking-wider">
                            {dayCount} DAYS
                        </span>
                    </div>
                    {/* 標題區 */}
                    <h1
                        className={`
                        text-3xl sm:text-4xl font-[Noto_Sans_TC] font-black leading-tight mb-2
                        ${titleColor} print:text-5xl print:text-black
                    `}
                    >
                        {tripData?.title}
                    </h1>
                    <h2 className="text-sm sm:text-base text-gray-400 font-medium tracking-wide uppercase mb-6 print:text-gray-600 print:mb-6 shrink-0">
                        {tripData?.subtitle}
                    </h2>
                    {/* 資訊格線區 (Grid) */}
                    <div className="w-full grid grid-cols-2 gap-6 border-t border-gray-100 pt-6 mb-6 print:border-gray-200 shrink-0">
                        {/* 日期 */}
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">
                                DATE
                            </span>
                            <div className="flex items-center gap-2 text-sm font-bold text-gray-700 print:text-black">
                                <Calendar
                                    size={16}
                                    className="text-rose-500 print:text-black"
                                />
                                <span>{tripData?.start_date}</span>
                            </div>
                            <div className="text-xs text-gray-400 pl-6">
                                to {tripData?.end_date}
                            </div>
                        </div>
                        {/* 地點 */}
                        {/* <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">
                                DESTINATION
                            </span>
                            <div className="flex items-center gap-2 text-sm font-bold text-gray-700 print:text-black">
                                <MapPin
                                    size={16}
                                    className="text-rose-500 print:text-black"
                                />
                                <span>
                                    Travel Destination
                                </span>
                            </div>
                        </div> */}
                    </div>

                    {/* 描述文字區 (一般瀏覽與列印皆顯示) */}
                    <div className="w-full relative pl-4 border-l-2 border-gray-200 print:border-gray-800">
                        <p
                            className={`
                            text-sm text-gray-500 leading-relaxed font-light text-justify
                            /* 螢幕: 不截斷，讓他可以捲動看完 */
                            ${
                                !isPrinting
                                    ? ""
                                    : "line-clamp-4 print:text-gray-800 print:line-clamp-4"
                            }
                        `}
                        >
                            {tripData?.description}
                        </p>
                    </div>
                    {/* 底部留白 (讓捲動時不要貼底) */}
                    {!isPrinting && <div className="h-8 shrink-0"></div>}
                </div>
            </div>
        </div>
    );
};

export default CoverPage;
