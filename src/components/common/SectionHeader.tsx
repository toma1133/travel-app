import { JSX } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TripThemeConf } from "../../models/types/TripTypes";
import SystemControls from "./SystemControls";
import BackBtn from "./BackBtn";

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
            className={`shrink-0 flex justify-between items-center px-3 sm:px-6 md:px-8 py-3 sm:py-4 sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50 transition-colors gap-2 min-w-0`}
        >
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 shrink">
                {hasBackBtn && <BackBtn />}
                <div className="min-w-0">
                    <h2
                        className={`text-lg sm:text-xl md:text-2xl font-[Noto_Sans_TC] font-bold tracking-tight text-foreground truncate`}
                        title={title}
                    >
                        {title}
                    </h2>
                    {subtitle && (
                        <p
                            className={`hidden md:block text-xs text-muted-foreground mt-0.5 font-mono uppercase tracking-widest`}
                        >
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                {rightAction}
                <SystemControls />
            </div>
        </div>
    );
};

export default SectionHeader;
