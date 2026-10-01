import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";

export default function useHorizontalScroll() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const drag = useRef<{ pointerId: number; x: number; left: number; moved: boolean } | null>(null);
    const suppressClick = useRef(false);
    const [bounds, setBounds] = useState({ overflow: false, left: false, right: false });

    useEffect(() => {
        const container = scrollRef.current;
        const content = contentRef.current;
        if (!container || !content) return;
        const updateBounds = () => {
            const max = container.scrollWidth - container.clientWidth;
            const next = { overflow: max > 1, left: container.scrollLeft > 1, right: container.scrollLeft < max - 1 };
            setBounds(previous => previous.overflow === next.overflow && previous.left === next.left && previous.right === next.right ? previous : next);
        };
        const onWheel = (event: WheelEvent) => {
            if (event.ctrlKey || !window.matchMedia("(min-width: 1024px) and (pointer: fine)").matches || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
            const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? container.clientWidth : 1;
            const next = Math.max(0, Math.min(container.scrollWidth - container.clientWidth, container.scrollLeft + event.deltaY * unit));
            if (next === container.scrollLeft) return;
            event.preventDefault();
            container.scrollTo({ left: next, behavior: "instant" });
        };
        const frame = requestAnimationFrame(updateBounds);
        container.addEventListener("scroll", updateBounds, { passive: true });
        container.addEventListener("wheel", onWheel, { passive: false });
        window.addEventListener("resize", updateBounds);
        const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateBounds);
        observer?.observe(container);
        observer?.observe(content);
        return () => {
            cancelAnimationFrame(frame);
            container.removeEventListener("scroll", updateBounds);
            container.removeEventListener("wheel", onWheel);
            window.removeEventListener("resize", updateBounds);
            observer?.disconnect();
        };
    }, []);

    const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
        if (event.pointerType !== "mouse" || event.button !== 0) return;
        suppressClick.current = false;
        drag.current = { pointerId: event.pointerId, x: event.clientX, left: event.currentTarget.scrollLeft, moved: false };
    };
    const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
        const current = drag.current;
        if (!current || current.pointerId !== event.pointerId) return;
        const distance = event.clientX - current.x;
        if (!current.moved && Math.abs(distance) < 6) return;
        if (!current.moved) {
            current.moved = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            event.currentTarget.dataset.dragging = "true";
        }
        suppressClick.current = true;
        event.preventDefault();
        event.currentTarget.scrollTo({ left: current.left - distance, behavior: "instant" });
    };
    const endDrag = (event: PointerEvent<HTMLDivElement>) => {
        if (drag.current?.pointerId !== event.pointerId) return;
        drag.current = null;
        delete event.currentTarget.dataset.dragging;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    };

    return {
        scrollRef, contentRef, bounds,
        scrollByPage: (direction: number) => {
            const container = scrollRef.current;
            container?.scrollBy({ left: direction * Math.max(120, container.clientWidth * 0.75), behavior: "smooth" });
        },
        handlers: {
            onPointerDown, onPointerMove,
            onPointerUp: endDrag,
            onPointerCancel: endDrag,
            onLostPointerCapture: endDrag,
            onPointerLeave: (event: PointerEvent<HTMLDivElement>) => { if (!drag.current?.moved) endDrag(event); },
            onClickCapture: (event: React.MouseEvent<HTMLDivElement>) => {
                if (!suppressClick.current) return;
                suppressClick.current = false;
                event.preventDefault();
                event.stopPropagation();
            },
        },
    };
}
