import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";

const DayItem = ({
    day,
    expanded,
    theme,
    categoryColor,
    isPrinting,
    onToggle,
    onNavigate,
}) => (
    <div
        className="bg-white rounded-lg shadow-sm border-l-4 border-gray-200 overflow-hidden break-inside-avoid print:shadow-none print:border print:border-gray-300"
        style={{
            borderLeftColor: expanded && !isPrinting ? "#8E354A" : "#E5E7EB",
        }}
    >
        <button
            onClick={onToggle}
            className={`w-full flex items-center justify-between p-4 bg-white transition-colors ${
                !isPrinting ? "hover:bg-gray-50" : "print:cursor-default"
            }`}
            disabled={isPrinting}
        >
            <div className="flex items-center">
                <div className="flex flex-col items-center mr-4 pr-4 border-r border-gray-100">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest print:text-gray-600">
                        {day.weekday}
                    </span>
                    <span
                        className={`text-2xl font-serif font-bold ${
                            theme.primary || "text-gray-900"
                        } print:text-gray-900`}
                    >
                        {day.date.split("-")[2]}
                    </span>
                </div>
                <div className="text-left">
                    <div className={`font-bold ${theme.primary}`}>
                        Day {day.day_number}
                    </div>
                    <div className="text-sm text-gray-500">{day.title}</div>
                </div>
            </div>
            {!isPrinting &&
                (expanded ? (
                    <ChevronUp size={20} className="text-gray-300" />
                ) : (
                    <ChevronDown size={20} className="text-gray-300" />
                ))}
        </button>
        {(expanded || isPrinting) && (
            <div className="px-4 pb-6 bg-white relative">
                <div className="space-y-4 ml-2 border-l border-dashed border-gray-200 pl-4">
                    {day.activities.map((activity, idx) => (
                        <div key={idx} className="relative">
                            <div
                                className={`absolute -left-5 top-1.5 w-2 h-2 rounded-full ring-2 ring-white print:ring-0 print:border print:border-gray-500`}
                                style={{
                                    backgroundColor:
                                        categoryColor[activity.type] ||
                                        categoryColor["shopping"],
                                }}
                            ></div>
                            <div className="flex items-baseline">
                                <span className="font-mono text-xs text-gray-400 w-12 shrink-0 pt-0.5 print:text-gray-600">
                                    {activity.time}
                                </span>
                                <span
                                    className={`text-sm font-bold ${
                                        theme.primary || "text-gray-800"
                                    } truncate pr-2 print:text-gray-900`}
                                >
                                    {activity.title}
                                </span>
                            </div>
                            {activity.desc && (
                                <p className="text-xs text-gray-500 ml-12 mt-0.5 print:text-gray-700">
                                    {activity.desc}
                                </p>
                            )}
                            {activity.linkId && !isPrinting && (
                                <button
                                    onClick={() => onNavigate(activity.linkId)}
                                    className="inline-flex items-center text-[10px] text-[#8E354A] bg-[#8E354A]/5 px-2 py-1 rounded ml-12 hover:bg-[#8E354A]/10 transition-colors"
                                >
                                    <BookOpen size={10} className="mr-1" />
                                    查看詳情
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
);

export default DayItem;
