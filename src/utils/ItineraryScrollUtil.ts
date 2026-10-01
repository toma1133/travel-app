function getDayScrollTop(container: HTMLElement, day: HTMLElement) {
    return Math.max(0, day.getBoundingClientRect().top - container.getBoundingClientRect().top - container.clientTop + container.scrollTop);
}

/** Reserve only the missing scroll range, including existing navigation padding. */
export function updateItineraryScrollSpace(container: HTMLElement, day: HTMLElement | null, spacer: HTMLElement) {
    let extraHeight = 0;
    if (day) {
        // The spacer's top is independent of its height; never remove it to measure,
        // since doing so can clamp scrollTop and visibly jump the user's position.
        const contentEnd = spacer.getBoundingClientRect().top - container.getBoundingClientRect().top - container.clientTop + container.scrollTop;
        const bottomPadding = parseFloat(getComputedStyle(container).paddingBottom) || 0;
        extraHeight = Math.max(0, Math.ceil(getDayScrollTop(container, day) + container.clientHeight - contentEnd - bottomPadding));
    }
    const height = `${extraHeight}px`;
    if (spacer.style.height !== height) spacer.style.height = height;
    return extraHeight;
}

/** Align the date header against the inner edge after day expansion commits. */
export function scrollToItineraryDay(container: HTMLElement, day: HTMLElement, spacer?: HTMLElement) {
    if (spacer) updateItineraryScrollSpace(container, day, spacer);
    container.scrollTo({ top: getDayScrollTop(container, day), behavior: "instant" });
}
