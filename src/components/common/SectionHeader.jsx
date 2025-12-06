import { ArrowLeft } from "lucide-react";

const SectionHeader = ({ title, subtitle, rightAction, theme }) => (
    <div
        className={`shrink-0 flex justify-between items-end px-4 py-4 pb-3 sticky backdrop-blur-md top-0 z-20`}
    >
        <div className="flex items-center">
            <div>
                <h2
                    className={`text-xl font-serif font-bold tracking-tight ${theme.primary}`}
                >
                    {title}
                </h2>
                {subtitle && (
                    <p
                        className={`text-xs ${theme.subtle} mt-1 font-mono uppercase tracking-widest`}
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
