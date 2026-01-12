import { useOutletContext, useParams } from "react-router-dom";
import { Calendar } from "lucide-react";
import moment from "moment";
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
                ${isPrinting ? "h-[98vh] max-h-[98vh] break-inside-avoid" : ""}
            `}
        >
            {/* 封面圖區域 */}
            <div
                className={`
                    w-full relative shrink-0
                    flex-1 min-h-[30%] 
                    ${isPrinting ? "h-[50%] flex-none" : ""}
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

                {/* 漸層遮罩 */}
                {/* <div
                    className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"
                    style={{
                        // 強制在列印時顯示背景圖形 (Safari/Chrome 預設列印不印背景色)
                        WebkitPrintColorAdjust: "exact",
                        printColorAdjust: "exact",
                    }}
                ></div> */}
                {/* <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-60"></div> */}
                {/* <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-60"></div> */}

                {/* [列印裝飾] 雜誌風格浮水印 */}
                {/* {isPrinting && (
                    <div className="absolute bottom-6 right-6 text-white opacity-80 text-right">
                        <p className="text-xs font-bold tracking-[0.3em] uppercase mb-1">
                            Travel Guidebook
                        </p>
                        <p className="text-4xl font-black tracking-tighter leading-none">
                            VOL.01
                        </p>
                    </div>
                )} */}
            </div>

            {/* 內容卡片區域 */}
            <div
                className={`
                    w-full bg-white relative z-10 flex flex-col
                    h-auto shrink-0
                    ${
                        !isPrinting
                            ? "-mt-10 rounded-t-4xl shadow-[0_-10px_30px_rgba(0,0,0,0.15)]"
                            : "mt-0 shadow-none rounded-none flex-1"
                    }
                `}
            >
                {/* 螢幕模式：Drag Handle */}
                {!isPrinting && (
                    <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-3 mb-1 shrink-0"></div>
                )}

                <div
                    className={`flex flex-col items-start justify-start px-8 py-8 ${
                        isPrinting ? "pt-12" : ""
                    }`}
                >
                    {/* [標籤] */}
                    <div className="flex items-center gap-3 mb-4 shrink-0">
                        <span
                            className={`
                                px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-white uppercase rounded-full 
                                ${
                                    isPrinting
                                        ? "bg-black text-white"
                                        : accentColor
                                }
                            `}
                        >
                            TRAVEL PLAN
                        </span>
                    </div>

                    {/* [標題] */}
                    <h1
                        className={`
                            text-3xl sm:text-4xl font-[Noto_Sans_TC] font-black leading-tight mb-2
                            ${titleColor} 
                            ${
                                isPrinting
                                    ? "text-3xl text-black mb-3 tracking-tight"
                                    : ""
                            }
                        `}
                    >
                        {tripData?.title}
                    </h1>
                    <h2
                        className={`
                            text-sm sm:text-base text-gray-400 font-medium tracking-wide uppercase mb-8 
                            ${
                                isPrinting
                                    ? "text-gray-500 text-lg mb-10 font-semibold shrink-0"
                                    : ""
                            }
                        `}
                    >
                        {tripData?.subtitle}
                    </h2>

                    {/* ==================================================================================
                       [核心修改] 日期區域 (Date Section) - 統一風格
                       ================================================================================== */}
                    <div
                        className={`
                        w-full py-5 mb-8
                        /* 螢幕：細灰線 / 列印：粗黑線 */
                        ${
                            isPrinting
                                ? "border-y-2 border-black"
                                : "border-y border-gray-200"
                        }
                    `}
                    >
                        <div
                            className={`
                            flex justify-between gap-6
                            ${
                                !isPrinting
                                    ? "flex-col sm:flex-row sm:items-center"
                                    : "items-center flex-wrap"
                            }
                        `}
                        >
                            {/* 左側：日期區間 */}
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">
                                        Start
                                    </span>
                                    <span
                                        className={`text-lg font-bold font-mono ${
                                            isPrinting
                                                ? "text-black"
                                                : "text-gray-800"
                                        }`}
                                    >
                                        {tripData?.start_date
                                            ? moment(
                                                  tripData.start_date
                                              ).format("YYYY.MM.DD")
                                            : "--"}
                                    </span>
                                </div>

                                {/* 分隔線：螢幕模式用淺灰，列印用深灰 */}
                                <div
                                    className={`h-8 w-px transform rotate-12 ${
                                        isPrinting
                                            ? "bg-gray-400"
                                            : "bg-gray-200"
                                    }`}
                                ></div>

                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">
                                        End
                                    </span>
                                    <span
                                        className={`text-lg font-bold font-mono ${
                                            isPrinting
                                                ? "text-black"
                                                : "text-gray-800"
                                        }`}
                                    >
                                        {tripData?.end_date
                                            ? moment(tripData.end_date).format(
                                                  "YYYY.MM.DD"
                                              )
                                            : "--"}
                                    </span>
                                </div>
                            </div>

                            {/* 右側：天數統計 */}
                            {/* 螢幕模式下：手機版靠左對齊，平板以上靠右對齊 */}
                            <div
                                className={`
                                    flex items-center gap-3 
                                    ${
                                        !isPrinting
                                            ? "sm:justify-end"
                                            : "justify-end"
                                    }
                                    shrink-0
                                `}
                            >
                                <div
                                    className={`${
                                        !isPrinting
                                            ? "text-left sm:text-right"
                                            : "text-left"
                                    }`}
                                >
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block mb-0.5">
                                        Duration
                                    </span>

                                    <span
                                        className={`
                                            text-lg font-black whitespace-nowrap
                                            ${
                                                isPrinting
                                                    ? "text-black"
                                                    : "text-gray-900"
                                            }
                                        `}
                                    >
                                        {dayCount} DAYS
                                    </span>
                                </div>

                                {/* Icon: 列印時純黑，螢幕時用主題色 */}
                                <div
                                    className={`
                                        p-2 rounded-full text-white 
                                        shrink-0
                                        ${isPrinting ? "bg-black" : accentColor}
                                    `}
                                >
                                    <Calendar size={16} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 描述文字區 */}
                    <div className="w-full relative">
                        <p
                            className={`
                                text-sm text-gray-500 leading-relaxed font-light text-justify
                                ${
                                    isPrinting
                                        ? "text-base text-gray-800 line-clamp-12"
                                        : ""
                                }
                            `}
                        >
                            {tripData?.description}
                        </p>
                    </div>

                    {/* 底部留白 */}
                    {!isPrinting && <div className="h-8 shrink-0"></div>}
                </div>
            </div>
        </div>
    );
};

export default CoverPage;
