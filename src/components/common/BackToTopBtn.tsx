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
    const right = position?.right ?? 25;
    const bottom = position?.bottom ?? 100;

    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            onClick={scrollToTop}
            className={[
                "fixed z-[50] inline-flex items-center justify-center",
                "rounded-full",
                "bg-blue-600 text-white shadow-lg",
                "hover:bg-blue-700 hover:translate-y-[-2px] transition",
                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400",
                "dark:bg-blue-500 dark:hover:bg-blue-600 dark:text-white",
                "w-11 h-11",
                "pb-[env(safe-area-inset-bottom)]",
                className || "",
            ].join(" ")}
            style={{
                right,
                bottom,
                display: visible ? "inline-flex" : "none",
            }}
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
