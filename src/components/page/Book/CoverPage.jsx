import { ArrowLeft, Calendar } from "lucide-react";

const CoverPage = ({ tripData, theme, isPrinting }) => (
    <div
        className={`relative h-full flex flex-col ${
            isPrinting ? "h-auto min-h-[50vh] break-after-page" : "bg-[#2C3E50]"
        }`}
    >
        <div className={`relative w-full overflow-hidden h-[65%]`}>
            <img
                src={tripData.cover_image}
                alt="Cover"
                className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-linear-to-t from-[#2C3E50] via-transparent to-transparent"></div>
            <div className="absolute top-10 right-8 flex flex-col items-center space-y-4 opacity-70">
                <div className="writing-vertical text-white text-lg font-[Noto_Sans_TC] tracking-widest border-r border-white/50 pr-3 h-32">
                    {tripData.cover_text}
                </div>
            </div>
        </div>
        <div className="flex-1 px-8 -mt-20 relative z-10">
            <div className="bg-[#F9F8F6] p-8 shadow-2xl rounded-t-sm h-full flex flex-col relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#8E354A]"></div>
                <div className="mt-4 text-center">
                    <span
                        className={`inline-block px-3 py-1 ${theme.accent} text-white text-[10px] tracking-widest mb-4`}
                    >
                        TRAVEL ITINERARY
                    </span>
                    <h1
                        className={`text-3xl font-[Noto_Sans_TC] font-bold ${theme.primary} mb-2`}
                    >
                        {tripData.title}
                    </h1>
                    <p
                        className={`text-sm ${theme.subtle} font-medium mb-6 uppercase tracking-widest`}
                    >
                        {tripData.subtitle}
                    </p>
                </div>
                <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 border-t border-gray-200 pt-6 mt-auto mb-6">
                    <Calendar size={14} />
                    <span>
                        {tripData.start_date} - {tripData.end_date}
                    </span>
                </div>
                <p
                    className={`text-sm ${theme.primary} leading-loose text-justify font-light opacity-90`}
                >
                    {tripData.description}
                </p>
            </div>
        </div>
        <style>{`.writing-vertical { writing-mode: vertical-rl; }`}</style>
    </div>
);

export default CoverPage;
