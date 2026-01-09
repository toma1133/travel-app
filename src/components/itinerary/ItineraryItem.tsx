import {
    BookOpen,
    ChevronDown,
    ChevronUp,
    Pencil,
    Plus,
    Trash2,
} from "lucide-react";
import type {
    ItineraryActivitiy,
    ItineraryVM,
} from "../../models/types/ItineraryTypes";
import type { TripThemeConf } from "../../models/types/TripTypes";

type ItineraryItemProps = {
    itinerary: ItineraryVM;
    isEditing: boolean;
    isExpanded: boolean;
    isPrinting?: boolean;
    theme: TripThemeConf | null;
    onAddActivityBtnClick: (itineraryDay: ItineraryVM) => void;
    onDeleteActivityBtnClick: (
        itineraryDay: ItineraryVM,
        activity: ItineraryActivitiy
    ) => void;
    onDeleteDayBtnClick: (itinerary: ItineraryVM) => void;
    onEditActivityBtnClick: (
        itineraryDay: ItineraryVM,
        activity: ItineraryActivitiy
    ) => void;
    onEditDayBtnClick: (itinerary: ItineraryVM) => void;
    onExpandedBtnToggle: (itinerary: ItineraryVM) => void;
    onViewBtnClick: (linkId: string) => void;
};

const ItineraryItem = ({
    itinerary,
    isEditing,
    isExpanded,
    isPrinting,
    theme,
    onAddActivityBtnClick,
    onDeleteActivityBtnClick,
    onDeleteDayBtnClick,
    onEditActivityBtnClick,
    onEditDayBtnClick,
    onExpandedBtnToggle,
    onViewBtnClick,
}: ItineraryItemProps) => {
    // 取得主題顏色或預設值
    const accentColor = theme?.accent || "bg-rose-600";
    const primaryTextColor = theme?.primary || "text-gray-900";

    return (
        <div
            className={`
              group relative
                /* 螢幕: 卡片懸浮感、圓角 */
                ${
                    !isPrinting
                        ? "bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 transition-all duration-300 hover:shadow-md"
                        : ""
                }
                /* 列印: 減少底部間距 (mb-4)，避免分頁斷開 */
                ${isPrinting ? "mb-4 break-inside-avoid" : ""}
            `}
        >
            {/* --- Day Header (日期標頭) --- */}
            <div
                onClick={
                    isEditing || isPrinting
                        ? undefined
                        : () => onExpandedBtnToggle(itinerary)
                }
                className={`
                    w-full flex items-stretch cursor-pointer overflow-hidden rounded-t-2xl
                    ${
                        isPrinting
                            ? "cursor-default border-b border-black pb-1 rounded-none"
                            : "p-0"
                    }
                `}
            >
                {/* 左側：日期視覺區塊 */}
                <div
                    className={`
                        flex flex-col items-center justify-center 
                        /* 列印: 縮小日期區塊寬度與內距 */
                        ${
                            isPrinting
                                ? "p-2 min-w-[50px]"
                                : "p-4 min-w-[80px] bg-gray-50 border-r border-gray-100"
                        }
                    `}
                >
                    <span
                        className={`font-black uppercase tracking-widest text-gray-400 ${
                            isPrinting ? "text-[8px] text-black" : "text-[10px]"
                        }`}
                    >
                        {itinerary.weekday}
                    </span>
                    <span
                        className={`font-[Noto_Sans_TC] font-black leading-none mt-1 ${primaryTextColor} ${
                            isPrinting ? "text-xl text-black" : "text-3xl"
                        }`}
                    >
                        {itinerary.date.split("-")[2]}
                    </span>
                    <span
                        className={`text-gray-400 mt-1 ${
                            isPrinting
                                ? "text-[8px] text-gray-600"
                                : "text-[10px]"
                        }`}
                    >
                        {itinerary.date.split("-")[1]}月
                    </span>
                </div>

                {/* 右側：標題與操作區 */}
                <div
                    className={`
                        flex-1 flex flex-col justify-center relative 
                        ${isPrinting ? "px-3 py-1" : "px-5 py-3"} 
                        min-w-0
                    `}
                >
                    <div className="flex justify-between items-center w-full min-w-0">
                        <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
                            {/* Day Badge */}
                            <span
                                className={`
                                    rounded-full font-bold text-white tracking-wide shadow-sm shrink-0 whitespace-nowrap
                                    ${
                                        !isPrinting
                                            ? `px-2.5 py-0.5 text-[10px] ${accentColor}`
                                            : "px-2 py-0 text-[9px] bg-black text-white border border-black"
                                    }
                                `}
                            >
                                DAY {itinerary.day_number}
                            </span>
                            <h3
                                className={`
                                    font-bold ${primaryTextColor}
                                    ${
                                        isPrinting
                                            ? "text-base text-black whitespace-normal"
                                            : "text-md truncate"
                                    }
                                `}
                            >
                                {itinerary.title || "未命名行程"}
                            </h3>
                        </div>
                        {/* 螢幕模式：展開/收合箭頭 */}
                        {!isPrinting && !isEditing && (
                            <div className="text-gray-300 transition-transform duration-300 group-hover:text-gray-500 shrink-0">
                                {isExpanded ? (
                                    <ChevronUp size={20} />
                                ) : (
                                    <ChevronDown size={20} />
                                )}
                            </div>
                        )}
                    </div>
                    {/* 編輯模式下的工具列 (只要 isEditing=true 就顯示，不需 Hover) */}
                    {!isPrinting && isEditing && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white pl-2">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAddActivityBtnClick(itinerary);
                                }}
                                className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-blue-500 transition-all shadow-sm border border-gray-100 hover:border-transparent"
                                title="新增活動"
                            >
                                <Plus size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEditDayBtnClick(itinerary);
                                }}
                                className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-600 transition-all shadow-sm border border-gray-100 hover:border-transparent"
                                title="編輯日程"
                            >
                                <Pencil size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteDayBtnClick(itinerary);
                                }}
                                className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-red-500 transition-all shadow-sm border border-gray-100 hover:border-transparent"
                                title="刪除日程"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* --- Content (時間軸內容) --- */}
            {(isExpanded || isPrinting) && (
                <div
                    className={`relative ${
                        isPrinting ? "pt-2 pb-2" : "pb-6 pt-2"
                    }`}
                >
                    <div className="absolute top-0 bottom-6 left-0 w-14 flex justify-center pointer-events-none">
                        <div
                            className={`w-[2px] h-full ${
                                !isPrinting ? "bg-gray-100" : "bg-gray-300"
                            }`}
                        ></div>
                    </div>

                    <div
                        className={`
                            ${isPrinting ? "space-y-2" : "space-y-6"}
                        `}
                    >
                        {Array.isArray(itinerary.activities) &&
                        itinerary.activities.length > 0 ? (
                            itinerary.activities.map((activity, idx) => (
                                /* [Flex 排版核心]
                                   使用 Flex 將 "左側軌道" 與 "右側內容" 分開
                                   這樣圓點跟文字永遠會對齊，不會因為 padding 跑掉
                                */
                                <div
                                    key={idx}
                                    className={`
                                        flex group/item items-start
                                        ${
                                            isPrinting
                                                ? "min-h-0"
                                                : "min-h-[40px]"
                                        }
                                    `}
                                >
                                    {/* 1. 左側軌道 (Track Column) */}
                                    <div className="w-14 shrink-0 flex justify-center items-start z-10">
                                        <div
                                            className={`
                                                rounded-full border-[3px] box-content
                                                ${
                                                    !isPrinting
                                                        ? "w-3.5 h-3.5 border-white shadow-sm"
                                                        : "w-2.5 h-2.5 border-white" // 列印時圓點稍微縮小
                                                }
                                            `}
                                            style={{
                                                backgroundColor:
                                                    theme?.categoryColor[
                                                        activity.type
                                                    ] || "#CBD5E1",
                                                printColorAdjust: "exact",
                                                WebkitPrintColorAdjust: "exact",
                                            }}
                                        ></div>
                                    </div>

                                    {/* 2. 右側內容 (Content Column) */}
                                    <div
                                        className={`
                                            flex-1 flex flex-col items-start pr-6
                                            ${
                                                !isPrinting
                                                    ? "transition-transform duration-200 group-hover/item:translate-x-1"
                                                    : ""
                                            }
                                        `}
                                    >
                                        <div className="flex items-start gap-3 w-full">
                                            {/* 時間 */}
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <span
                                                    className={`
                                                    font-mono font-bold 
                                                    /* 列印時時間字體縮小 */
                                                    ${
                                                        isPrinting
                                                            ? "text-xs text-black"
                                                            : "text-sm text-gray-400 group-hover/item:text-gray-600"
                                                    }
                                                `}
                                                >
                                                    {activity.time}
                                                </span>
                                            </div>

                                            {/* 標題與描述 */}
                                            <div className="flex-1 min-w-0">
                                                <h4
                                                    className={`
                                                    font-bold leading-tight
                                                    ${primaryTextColor} 
                                                    /* 列印時標題縮小 */
                                                    ${
                                                        isPrinting
                                                            ? "text-sm text-black"
                                                            : "text-sm"
                                                    }
                                                `}
                                                >
                                                    {activity.title}
                                                </h4>

                                                {activity.desc && (
                                                    <p
                                                        className={`
                                                        text-gray-500 leading-relaxed whitespace-pre-wrap
                                                        /* 列印時描述縮小且行距變緊 */
                                                        ${
                                                            isPrinting
                                                                ? "text-[10px] mt-0.5 text-gray-700"
                                                                : "text-xs mt-1"
                                                        }
                                                    `}
                                                    >
                                                        {activity.desc}
                                                    </p>
                                                )}
                                            </div>
                                            {!isPrinting && (
                                                <div
                                                    className={`
                                                        flex items-center gap-1 transition-opacity duration-200 ml-2
                                                    `}
                                                >
                                                    {!isEditing &&
                                                        activity.linkId && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    onViewBtnClick(
                                                                        activity.linkId!
                                                                    )
                                                                }
                                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                                title="查看詳情"
                                                            >
                                                                <BookOpen
                                                                    size={12}
                                                                />
                                                            </button>
                                                        )}
                                                    {isEditing && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    onEditActivityBtnClick(
                                                                        itinerary,
                                                                        activity
                                                                    )
                                                                }
                                                                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                                                title="編輯活動"
                                                            >
                                                                <Pencil
                                                                    size={12}
                                                                />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    onDeleteActivityBtnClick(
                                                                        itinerary,
                                                                        activity
                                                                    )
                                                                }
                                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                                title="刪除活動"
                                                            >
                                                                <Trash2
                                                                    size={12}
                                                                />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            // 空狀態
                            <div className="flex">
                                <div className="w-14 shrink-0"></div>{" "}
                                {/* 佔位符保持對齊 */}
                                <div className="py-2">
                                    <p className="text-xs text-gray-400 italic">
                                        尚無活動，點擊上方 + 新增
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ItineraryItem;
