import { JSX } from "react";
import { TripThemeConf } from "../../models/types/TripsTypes";

type SectionHeaderProps = {
    title: string;
    subtitle?: string;
    rightAction?: JSX.Element;
    theme: TripThemeConf | null;
};

const SectionHeader = ({
    title,
    subtitle,
    rightAction,
    theme,
}: SectionHeaderProps) => (
    <div
        className={`shrink-0 flex justify-between items-end px-4 py-4 pb-3 sticky backdrop-blur-md top-0 z-20`}
    >
        <div className="flex items-center">
            <div>
                <h2
                    className={`text-xl font-[Noto_Sans_TC] font-bold tracking-tight ${theme?.primary}`}
                >
                    {title}
                </h2>
                {subtitle && (
                    <p
                        className={`text-xs ${theme?.subtle} mt-1 font-mono uppercase tracking-widest`}
                    >
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
        {rightAction}
    </div>
);

export default SectionHeader;
