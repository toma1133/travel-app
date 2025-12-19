import { useEffect, useState, useCallback } from "react";

export function useBackToTop(showAt = 160, getTarget?: () => HTMLElement | null) {
    const [visible, setVisible] = useState(false);

    const getScrollTop = (el: HTMLElement | Window | Document): number => {
        if (el instanceof HTMLElement) return el.scrollTop;
        return window.pageYOffset || document.documentElement.scrollTop;
    };

    const scrollToTop = useCallback(() => {
        const target = getTarget?.() ?? window;
        // 針對指定容器回頂
        if (target instanceof HTMLElement) {
            try {
                target.scrollTo({ top: 0, behavior: "smooth" });
            } catch {
                target.scrollTop = 0;
            }
        } else {
            try {
                window.scrollTo({ top: 0, behavior: "smooth" });
            } catch {
                window.scrollTo(0, 0);
            }
        }
    }, [getTarget]);

    useEffect(() => {
        const targetEl = getTarget?.() ?? window;
        const onScroll = () => {
            const top = getScrollTop(targetEl as any);
            setVisible(top > showAt);
        };

        onScroll();

        if (targetEl instanceof HTMLElement) {
            targetEl.addEventListener("scroll", onScroll, { passive: true });
            return () => targetEl.removeEventListener("scroll", onScroll);
        } else {
            window.addEventListener("scroll", onScroll, { passive: true });
            return () => window.removeEventListener("scroll", onScroll);
        }
    }, [showAt, getTarget]);

    return { visible, scrollToTop };

}
