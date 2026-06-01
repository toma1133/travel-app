import { useOutletContext, useParams } from "react-router-dom";
import { Compass, ArrowRight } from "lucide-react";
import moment from "moment";
import type BookLayoutContextType from "../../models/types/BookLayoutContextTypes";
import type { TripVM } from "../../models/types/TripTypes";
import SystemControls from "../../components/common/SystemControls";

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

    const accentColor = tripData?.theme_config?.accent || "bg-primary";

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
                w-full h-full bg-background overflow-hidden flex flex-col relative
                print:h-auto print:min-h-[290mm] print:bg-white print:block print:overflow-visible
                ${isPrinting ? "h-auto min-h-[290mm] bg-white block overflow-visible" : ""}
            `}
        >
            {/* Top Nav (Floating) */}
            <nav className={`absolute top-0 right-0 w-full flex justify-between items-center px-6 md:px-12 py-6 z-50 pointer-events-none print:hidden ${isPrinting ? 'hidden' : ''}`}>
                <div className="pointer-events-auto">
                    <button
                        type="button"
                        onClick={() => window.location.href = "/"}
                        className="text-white/90 hover:text-white bg-black/20 backdrop-blur-md p-3 rounded-full border border-white/10 shadow-sm transition-all hover:bg-black/40 hover:scale-105"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                    </button>
                </div>
                <div className="pointer-events-auto">
                    <SystemControls className="bg-black/20 text-white border-white/10" />
                </div>
            </nav>

            {/* Background Hero Image */}
            <div className={`shrink-0 print:relative print:h-[40vh] ${isPrinting ? "relative h-[40vh]" : "absolute top-0 left-0 w-full h-[55%] md:h-[60%]"}`}>
                {tripData?.cover_image ? (
                    <img
                        src={tripData.cover_image}
                        alt="Cover"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground/30">
                        <Compass size={64} strokeWidth={1} />
                    </div>
                )}
                {/* Seamless Gradient Fade to Background */}
                <div className={`absolute inset-0 bg-gradient-to-t from-background via-background/60 to-black/20 print:hidden ${isPrinting ? "hidden" : ""}`}></div>
            </div>

            {/* Foreground Content Container */}
            <div className={`relative z-10 flex-1 flex flex-col px-6 md:px-12 pb-6 print:pt-12 print:pb-32 ${isPrinting ? "pt-12 pb-32" : "pt-[35vh] md:pt-[40vh]"}`}>
                
                {/* Title Block (Pushes up automatically via margins if needed, or stays centered) */}
                <div className={`shrink-0 mb-auto print:mb-12 ${isPrinting ? "mb-12" : ""}`}>
                    <div className="flex items-center gap-4 mb-3 md:mb-5">
                        <span className={`px-4 py-1.5 text-[10px] md:text-xs font-black tracking-[0.3em] uppercase rounded-full shadow-lg ${isPrinting ? "bg-black text-white" : "bg-primary text-primary-foreground"}`}>
                            JOURNEY
                        </span>
                    </div>
                    <h1 className={`text-4xl sm:text-6xl md:text-7xl font-[Noto_Sans_TC] font-black drop-shadow-sm tracking-tighter leading-[1.1] max-w-5xl line-clamp-2 print:text-black print:drop-shadow-none ${isPrinting ? "text-black drop-shadow-none" : "text-foreground"}`}>
                        {tripData?.title || "Untitled Trip"}
                    </h1>
                    {tripData?.subtitle && (
                        <h2 className={`text-lg md:text-2xl font-medium max-w-3xl leading-snug mt-2 line-clamp-1 print:text-gray-600 print:mt-4 ${isPrinting ? "text-gray-600 mt-4" : "text-muted-foreground"}`}>
                            {tripData.subtitle}
                        </h2>
                    )}
                </div>

                {/* Info Grid & Description Block */}
                <div className={`shrink-0 mt-6 flex flex-col gap-4 md:gap-6 print:mt-auto print:mb-12 ${isPrinting ? "mt-auto mb-12" : ""}`}>
                    
                    {/* Editorial Info Grid */}
                    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 py-4 md:py-8 border-y border-border print:border-black print:border-y-2 ${isPrinting ? "border-black border-y-2" : ""}`}>
                        <div className="flex flex-col gap-1 md:gap-2">
                            <span className={`text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] print:text-gray-500 ${isPrinting ? "text-gray-500" : "text-muted-foreground"}`}>Departure</span>
                            <span className={`text-xl md:text-3xl font-medium font-mono whitespace-nowrap print:text-black ${isPrinting ? "text-black" : "text-foreground"}`}>
                                {tripData?.start_date ? moment(tripData.start_date).format("MMM DD") : "--"}
                            </span>
                        </div>

                        <div className="flex flex-col gap-2 hidden md:flex items-center justify-center text-muted-foreground/30">
                            <ArrowRight size={28} strokeWidth={1} />
                        </div>

                        <div className="flex flex-col gap-1 md:gap-2">
                            <span className={`text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] print:text-gray-500 ${isPrinting ? "text-gray-500" : "text-muted-foreground"}`}>Return</span>
                            <span className={`text-xl md:text-3xl font-medium font-mono whitespace-nowrap print:text-black ${isPrinting ? "text-black" : "text-foreground"}`}>
                                {tripData?.end_date ? moment(tripData.end_date).format("MMM DD") : "--"}
                            </span>
                        </div>

                        <div className="flex flex-col gap-1 md:gap-2 md:items-end md:text-right">
                            <span className={`text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] print:text-gray-500 ${isPrinting ? "text-gray-500" : "text-muted-foreground"}`}>Duration</span>
                            <div className="flex items-baseline gap-2">
                                <span className={`text-2xl md:text-4xl font-black print:text-black ${isPrinting ? "text-black" : "text-foreground"}`}>
                                    {dayCount}
                                </span>
                                <span className={`text-xs md:text-sm font-medium uppercase tracking-widest ${isPrinting ? "text-gray-500" : "text-muted-foreground"}`}>Days</span>
                            </div>
                        </div>
                    </div>

                    {/* Description - Clamped to prevent scrolling */}
                    {tripData?.description && (
                        <div className={`max-w-4xl print:max-w-none ${isPrinting ? "max-w-none" : ""}`}>
                            <p className={`text-sm md:text-base leading-relaxed font-light text-justify print:text-gray-800 print:line-clamp-none ${isPrinting ? "text-gray-800 line-clamp-none" : "text-muted-foreground/90 line-clamp-3 md:line-clamp-4"}`}>
                                {tripData.description}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CoverPage;
