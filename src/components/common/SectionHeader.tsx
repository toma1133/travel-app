import { JSX } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TripThemeConf } from "../../models/types/TripTypes";
import SystemControls from "./SystemControls";

type SectionHeaderProps = {
    title: string;
    subtitle?: string;
    rightAction?: JSX.Element;
    theme: TripThemeConf | null;
    hasBackBtn?: boolean;
};

const SectionHeader = ({
    title,
    subtitle,
    rightAction,
    theme,
    hasBackBtn = false,
}: SectionHeaderProps) => {
    const navigate = useNavigate();
    
    return (
        <div
            className={`shrink-0 flex justify-between items-center px-4 md:px-8 py-4 sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50 transition-colors`}
        >
            <div className="flex items-center gap-4">
                {hasBackBtn && (
                    <button
                        type="button"
                        onClick={() => navigate("/", { replace: false })}
                        className="text-foreground/80 hover:text-foreground p-2 -ml-2 rounded-full hover:bg-accent transition-colors shrink-0"
                    >
                        <ArrowLeft size={20} />
                    </button>
                )}
                <div className="hidden md:inline-block">
                    <h2
                        className={`text-2xl font-[Noto_Sans_TC] font-bold tracking-tight text-foreground line-clamp-1`}
                        title={title}
                    >
                        {title}
                    </h2>
                    {subtitle && (
                        <p
                            className={`text-xs text-muted-foreground mt-1 font-mono uppercase tracking-widest`}
                        >
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4 shrink-0 pl-2">
                {rightAction}
                <SystemControls />
            </div>
        </div>
    );
};

export default SectionHeader;
