import { getBrowserTimeZone, getTimeZones } from "../../utils/DateTimeUtil";

const zones = getTimeZones();
export default function TimeZoneSelect({ value, onChange, label = "時區", disabled = false }: {
    value?: string | null; onChange: (value: string) => void; label?: string; disabled?: boolean;
}) {
    const browserTimeZone = getBrowserTimeZone();
    const current = value || browserTimeZone;
    return <label className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>{label}</span>
        <select aria-label={label} value={current} disabled={disabled} onChange={e => onChange(e.target.value)}
            className="min-w-0 max-w-full rounded-xl border border-border bg-card px-2 py-1.5 text-foreground">
            {[...new Set([current, ...zones])].map(zone => <option key={zone} value={zone}>
                {zone}{zone === browserTimeZone ? "（瀏覽器時區）" : ""}
            </option>)}
        </select>
    </label>;
}
