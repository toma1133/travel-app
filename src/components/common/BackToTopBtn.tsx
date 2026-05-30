import { ArrowUp } from "lucide-react";
import { useBackToTop } from "../../hooks/UseBackToTop";

type TabButtonProps = {
    showAt?: number;
    className?: string;
    label?: string;
    size?: number;
    position?: {
        right?: number;
        bottom?: number;
    };
    getTarget?: () => HTMLElement | null;
};

const BackToTopButton = ({
    showAt = 160,
    className,
    label = "回到頁面頂端",
    size = 22,
    position,
    getTarget,
}: TabButtonProps) => {
    const { visible, scrollToTop } = useBackToTop(showAt, getTarget);

    // If position is provided, use it. Otherwise, fallback to a sensible responsive default via Tailwind classes
    const style: React.CSSProperties = {
        display: visible ? "inline-flex" : "none",
    };
    if (position?.right !== undefined) style.right = position.right;
    if (position?.bottom !== undefined) style.bottom = position.bottom;

    const defaultPositionClass = position ? "" : "bottom-[90px] md:bottom-10 right-6 md:right-8";

    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            onClick={scrollToTop}
            className={`
                fixed z-50 inline-flex items-center justify-center
                rounded-full w-12 h-12 shadow-lg backdrop-blur-md
                bg-background/80 border border-border text-foreground
                hover:bg-accent hover:text-accent-foreground transition-all
                hover:-translate-y-1
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                pb-[env(safe-area-inset-bottom)]
                ${defaultPositionClass}
                ${className || ""}
            `}
            style={style}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    scrollToTop();
                }
            }}
        >
            <ArrowUp size={size} aria-hidden="true" />
        </button>
    );
};

export default BackToTopButton;
