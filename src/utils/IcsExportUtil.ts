import type { ItineraryVM } from "../models/types/ItineraryTypes";
import { localToUtc } from "./DateTimeUtil";

/**
 * Generate iCalendar (.ics) string for the entire trip itinerary
 */
export const generateICS = (tripTitle: string, itinerarys: ItineraryVM[]): string => {
    const icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//TravelApp//Trip Itinerary//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        `X-WR-CALNAME:${tripTitle}`,
    ];

    itinerarys.forEach((day) => {
        const dateStr = day.date.replace(/-/g, ""); // YYYYMMDD

        (day.activities || []).forEach((act) => {
            const isUtc = act.is_utc ?? day.is_utc;
            const start = isUtc
                ? act.time_utc || localToUtc(act.time_date || day.date, act.time || "09:00", act.display_time_zone || act.time_zone || day.time_zone || undefined)
                : `${day.date}T${act.time?.slice(0, 5) || "09:00"}:00Z`;
            const format = (value: string) => value.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, isUtc ? "Z" : "").replace(/Z$/, isUtc ? "Z" : "");
            const dtStart = format(new Date(start).toISOString());
            const dtEnd = format(new Date(Date.parse(start) + 3600000).toISOString());

            const summary = `[${day.title || `Day ${day.day_number}`}] ${act.title}`;
            let description = act.desc || "";
            if (act.duration) description += `\\n停留時間: ${act.duration}`;
            if (act.transitDuration) description += `\\n交通車程: ${act.transitDuration}`;

            icsContent.push(
                "BEGIN:VEVENT",
                `UID:${day.id}-${act.activityIndex}@travelapp`,
                `DTSTAMP:${dateStr}T000000Z`,
                `DTSTART:${dtStart}`,
                `DTEND:${dtEnd}`,
                `SUMMARY:${summary}`,
                `DESCRIPTION:${description}`,
                "END:VEVENT"
            );
        });
    });

    icsContent.push("END:VCALENDAR");
    return icsContent.join("\r\n");
};

/**
 * Download .ics file directly in browser
 */
export const downloadICS = (tripTitle: string, itinerarys: ItineraryVM[]) => {
    const icsData = generateICS(tripTitle, itinerarys);
    const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${tripTitle || "travel_itinerary"}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
