import type { ItineraryVM } from "../models/types/ItineraryTypes";

/**
 * Generate iCalendar (.ics) string for the entire trip itinerary
 */
export const generateICS = (tripTitle: string, itinerarys: ItineraryVM[]): string => {
    let icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//TravelApp//Trip Itinerary//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        `X-WR-CALNAME:${tripTitle}`,
    ];

    itinerarys.forEach((day) => {
        const dateStr = day.date.replace(/-/g, ""); // YYYYMMDD

        day.activities.forEach((act) => {
            const timeClean = act.time ? act.time.replace(":", "") : "0900";
            const dtStart = `${dateStr}T${timeClean}00`;
            
            // Calculate default end time (+1 hour)
            const hour = parseInt(timeClean.substring(0, 2) || "09", 10);
            const endHourStr = String((hour + 1) % 24).padStart(2, "0");
            const dtEnd = `${dateStr}T${endHourStr}${timeClean.substring(2, 4) || "00"}00`;

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
