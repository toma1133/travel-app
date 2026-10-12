const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const test = require('node:test');
const assert = require('node:assert/strict');
const cache = new Map();
function load(file) {
    const filename = path.resolve(__dirname, '../', file);
    if (cache.has(filename)) return cache.get(filename).exports;
    const mod = new Module(filename, module);
    mod.filename = filename;
    mod.paths = module.paths;
    cache.set(filename, mod);
    mod.require = request => request.startsWith('.')
        ? load(path.relative(path.resolve(__dirname, '..'), path.resolve(path.dirname(filename), request + '.ts')))
        : require(request);
    mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
        fileName: filename,
        compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX },
    }).outputText, filename);
    return mod.exports;
}
const { localToUtc, utcToLocal, getBrowserTimeZone } = load('src/utils/DateTimeUtil.ts');
const { toFlightStorage, toFlightVM, toFlightForm } = load('src/services/mappers/FlightMapper.ts');
const { toItineraryVM, toItineraryInsert, toItineraryUpdate, toItineraryActivityForm } = load('src/services/mappers/ItineraryMapper.ts');
const { generateICS } = load('src/utils/IcsExportUtil.ts');
const { computeDayTimelineSchedule, getTimelineConnection, compareItineraryActivities } = load('src/utils/ItineraryTimeUtil.ts');
const day = { id: 'day', trip_id: 'trip', user_id: 'user', date: '2026-10-12', day_number: 1, title: '行程',
    activities: [{ activityIndex: 0, time: '00:30', title: '出發', type: 'sight', desc: '', linkId: '' }] };
const flight = { id: 'flight', trip_id: 'trip', user_id: 'user', code: 'BR', is_utc: true,
    flight_date: '2026-10-12', departure_time: '23:30', departure_time_zone: 'Asia/Taipei',
    arrival_date: '2026-10-13', arrival_time: '03:00', arrival_time_zone: 'Asia/Tokyo' };

test('UTC conversion handles midnight, negative offsets and fractional-hour offsets', () => {
    assert.equal(localToUtc('2026-10-12', '00:30', 'Asia/Taipei'), '2026-10-11T16:30:00.000Z');
    assert.equal(localToUtc('2026-10-12', '23:30', 'America/Los_Angeles'), '2026-10-13T06:30:00.000Z');
    assert.equal(localToUtc('2026-10-12', '12:00', 'Asia/Kathmandu'), '2026-10-12T06:15:00.000Z');
    assert.deepEqual(utcToLocal('2026-10-11T16:30:00.000Z', 'Asia/Taipei'), { date: '2026-10-12', time: '00:30', seconds: '00' });
});
test('conversion defaults to the browser system zone', () => {
    const expected = utcToLocal('2026-10-12T00:00:00Z', getBrowserTimeZone());
    assert.deepEqual(utcToLocal('2026-10-12T00:00:00Z'), expected);
});
test('invalid dates and daylight-saving gaps/folds are rejected', () => {
    assert.throws(() => localToUtc('2026-02-30', '12:00', 'UTC'), /無效/);
    assert.throws(() => localToUtc('2026-10-12', '24:00', 'UTC'), /無效/);
    assert.throws(() => localToUtc('2026-03-08', '02:30', 'America/New_York'), /不存在/);
    assert.throws(() => localToUtc('2026-11-01', '01:30', 'America/New_York'), /重複/);
    assert.equal(localToUtc('2026-11-01', '01:30', 'America/New_York', '2026-11-01T06:30:42Z'), '2026-11-01T06:30:42Z');
    assert.equal(localToUtc('2026-07-01', '12:00', 'America/New_York'), '2026-07-01T16:00:00.000Z');
    assert.equal(localToUtc('2026-01-01', '12:00', 'America/New_York'), '2026-01-01T17:00:00.000Z');
});
test('legacy flights without a flag retain their exact date/time and need no arrival date', () => {
    const legacy = { flight_date: null, departure_time: '10:00', arrival_time: '14:00' };
    assert.deepEqual(toFlightVM(legacy, 'UTC'), legacy);
    assert.deepEqual(toFlightStorage(legacy), legacy);
    assert.deepEqual(toFlightForm(legacy), legacy);
    assert.deepEqual(toFlightStorage({ ...legacy, is_utc: false }), { ...legacy, is_utc: false, departure_at_utc: null, arrival_at_utc: null });
});
test('cross-zone overnight flights store full UTC timestamps and round-trip without drift', () => {
    const stored = toFlightStorage(flight);
    assert.equal(stored.departure_at_utc, '2026-10-12T15:30:00.000Z');
    assert.equal(stored.arrival_at_utc, '2026-10-12T18:00:00.000Z');
    assert.equal((Date.parse(stored.arrival_at_utc) - Date.parse(stored.departure_at_utc)) / 3600000, 2.5);
    const projected = toFlightVM(stored, 'America/Los_Angeles');
    assert.equal(projected.flight_date, '2026-10-12');
    assert.equal(projected.departure_time, '08:30');
    assert.equal(projected.arrival_time, '11:00');
    assert.equal(projected.arrival_date, '2026-10-12');
    assert.equal(projected.departure_time_zone, 'Asia/Taipei');
    assert.equal(projected.arrival_time_zone, 'Asia/Tokyo');
    assert.equal(projected.display_time_zone, 'America/Los_Angeles');
    const resaved = toFlightStorage({ ...projected, code: 'BR123' });
    assert.equal(resaved.departure_at_utc, stored.departure_at_utc);
    assert.equal(resaved.arrival_at_utc, stored.arrival_at_utc);
    assert.equal(resaved.departure_time_zone, stored.departure_time_zone);
    assert.equal(resaved.arrival_time_zone, stored.arrival_time_zone);
    assert.equal('display_time_zone' in resaved, false);
});
test('editing after display-zone changes or a reload restores independently saved airport zones', () => {
    const stored = toFlightStorage(flight);
    const original = structuredClone(stored);
    for (const zone of ['UTC', 'America/Los_Angeles', 'Pacific/Honolulu', 'Asia/Tokyo']) {
        const projected = toFlightVM(JSON.parse(JSON.stringify(stored)), zone);
        const form = toFlightForm(projected);
        assert.equal(form.departure_time_zone, 'Asia/Taipei');
        assert.equal(form.arrival_time_zone, 'Asia/Tokyo');
        assert.equal(form.flight_date, flight.flight_date);
        assert.equal(form.departure_time, flight.departure_time);
        assert.equal(form.arrival_date, flight.arrival_date);
        assert.equal(form.arrival_time, flight.arrival_time);
        assert.equal('display_time_zone' in form, false);
        const saved = toFlightStorage({ ...form, code: 'BR999' });
        assert.equal(saved.departure_at_utc, stored.departure_at_utc);
        assert.equal(saved.arrival_at_utc, stored.arrival_at_utc);
        assert.equal(saved.departure_time_zone, stored.departure_time_zone);
        assert.equal(saved.arrival_time_zone, stored.arrival_time_zone);
    }
    assert.deepEqual(stored, original);
});
test('editing an endpoint local time uses that endpoint saved zone rather than the display zone', () => {
    const stored = toFlightStorage(flight);
    const form = toFlightForm(toFlightVM(stored, 'UTC'));
    const saved = toFlightStorage({ ...form, arrival_time: '04:00' });
    assert.equal(saved.arrival_at_utc, '2026-10-12T19:00:00.000Z');
    assert.equal(saved.departure_at_utc, stored.departure_at_utc);
    assert.equal(saved.arrival_time_zone, 'Asia/Tokyo');
});
test('date-line flights can arrive on an earlier local date', () => {
    const stored = toFlightStorage({ ...flight, departure_time: '09:00', departure_time_zone: 'Asia/Tokyo',
        arrival_date: '2026-10-11', arrival_time: '22:00', arrival_time_zone: 'Pacific/Honolulu' });
    assert.equal((Date.parse(stored.arrival_at_utc) - Date.parse(stored.departure_at_utc)) / 3600000, 8);
});
test('UTC flights require arrival date and chronological instants', () => {
    assert.throws(() => toFlightStorage({ ...flight, arrival_date: '' }), /完整日期/);
    assert.throws(() => toFlightStorage({ ...flight, arrival_date: '2026-10-12' }), /晚於/);
});
test('legacy itinerary JSON and calendar date remain unchanged', () => {
    const vm = toItineraryVM(day, 'America/Los_Angeles');
    assert.deepEqual(vm.activities, day.activities);
    const storage = toItineraryInsert(vm);
    assert.equal(storage.date, day.date);
    assert.deepEqual(storage.activities, day.activities);
    assert.equal(storage.is_utc, undefined);
    assert.equal(storage.date_utc, undefined);
});
test('UTC itinerary preserves the sync calendar anchor and shows shifted activity dates', () => {
    const stored = toItineraryInsert({ ...day, is_utc: true, time_zone: 'Asia/Taipei' });
    assert.equal(stored.date, '2026-10-12');
    assert.equal(stored.date_utc, '2026-10-11T16:00:00.000Z');
    assert.equal(stored.activities[0].time_utc, '2026-10-11T16:30:00.000Z');
    const vm = toItineraryVM({ ...stored, id: 'day' }, 'America/Los_Angeles');
    assert.equal(vm.date, '2026-10-12');
    assert.equal(vm.activities[0].time, '09:30');
    assert.equal(vm.activities[0].time_date, '2026-10-11');
    const updated = toItineraryUpdate({ ...vm, title: '改標題' });
    assert.equal(updated.date_utc, stored.date_utc);
    assert.equal(updated.activities[0].time_utc, stored.activities[0].time_utc);
    assert.equal(updated.date, day.date);
});
test('editing UTC activity time or date recalculates the instant', () => {
    const stored = toItineraryInsert({ ...day, is_utc: true, time_zone: 'Asia/Taipei' });
    const vm = toItineraryVM(stored, 'UTC');
    vm.activities[0].time = '17:00';
    assert.equal(toItineraryUpdate(vm).activities[0].time_utc, '2026-10-11T17:00:00.000Z');
    vm.activities[0].time_date = '2026-10-13';
    assert.equal(toItineraryUpdate(vm).activities[0].time_utc, '2026-10-13T17:00:00.000Z');
    assert.equal(toItineraryUpdate({ ...vm, date: '2026-10-14' }).activities[0].time_utc, '2026-10-14T17:00:00.000Z');
});
test('turning off the flag clears UTC authority for both activities and flights', () => {
    const vm = toItineraryVM(toItineraryInsert({ ...day, is_utc: true, time_zone: 'Asia/Taipei' }), 'UTC');
    const updated = toItineraryUpdate({ ...vm, is_utc: false });
    assert.equal(updated.date_utc, null);
    assert.equal(updated.activities[0].time_utc, undefined);
    const flightLegacy = toFlightStorage({ ...toFlightVM(toFlightStorage(flight)), is_utc: false });
    assert.equal(flightLegacy.departure_at_utc, null);
    assert.equal(flightLegacy.arrival_at_utc, null);
});
test('UTC transit schedules support explicit arrival dates', () => {
    const vm = { ...day, is_utc: true, time_zone: 'Asia/Taipei', activities: [{ ...day.activities[0], transitDetails: {
        scheduleList: [{ name: '夜車', departureTime: '23:30', arrivalTime: '01:00', arrivalDate: '2026-10-13' }],
    } }] };
    const stored = toItineraryInsert(vm);
    const schedule = stored.activities[0].transitDetails.scheduleList[0];
    assert.equal(schedule.departureUtc, '2026-10-12T15:30:00.000Z');
    assert.equal(schedule.arrivalUtc, '2026-10-12T17:00:00.000Z');
    const projected = toItineraryVM(stored, 'UTC');
    assert.equal(projected.activities[0].transitDetails.scheduleList[0].arrivalDate, '2026-10-12');
});

const mixedZoneDay = { ...day, is_utc: true, time_zone: 'Asia/Taipei', activities: [
    { ...day.activities[0], title: '起飛', is_utc: true, time_zone: 'Asia/Taipei', time_date: '2026-10-12', time: '23:30' },
    { ...day.activities[0], activityIndex: 1, title: '抵達', is_utc: true, time_zone: 'Asia/Tokyo', time_date: '2026-10-13', time: '03:00' },
] };
test('same-day activities store independently selected source zones and UTC instants', () => {
    const stored = toItineraryInsert(mixedZoneDay);
    assert.equal(stored.activities[0].time_utc, '2026-10-12T15:30:00.000Z');
    assert.equal(stored.activities[1].time_utc, '2026-10-12T18:00:00.000Z');
    assert.equal(stored.activities[0].time_zone, 'Asia/Taipei');
    assert.equal(stored.activities[1].time_zone, 'Asia/Tokyo');
    assert.equal(stored.activities[1].time_date, '2026-10-13');
});
test('activity editors retain their own zones after reload and display-zone changes', () => {
    const stored = toItineraryInsert(mixedZoneDay);
    for (const zone of ['UTC', 'America/Los_Angeles', 'Asia/Taipei', 'Asia/Tokyo']) {
        const vm = toItineraryVM(JSON.parse(JSON.stringify(stored)), zone);
        assert.equal(vm.time_zone, 'Asia/Taipei');
        vm.activities.forEach((activity, index) => {
            const form = toItineraryActivityForm(activity, vm);
            assert.equal(form.time_zone, mixedZoneDay.activities[index].time_zone);
            assert.equal(form.time, mixedZoneDay.activities[index].time);
            assert.equal(form.time_date, mixedZoneDay.activities[index].time_date);
            assert.equal('display_time_zone' in form, false);
        });
        const saved = toItineraryUpdate({ ...vm, title: '只修改日程標題' });
        saved.activities.forEach((activity, index) => {
            assert.equal(activity.time_utc, stored.activities[index].time_utc);
            assert.equal(activity.time_zone, stored.activities[index].time_zone);
            assert.equal('display_time_zone' in activity, false);
        });
    }
});
test('editing one activity in its source zone preserves other projected activities', () => {
    const stored = toItineraryInsert(mixedZoneDay);
    const vm = toItineraryVM(stored, 'UTC');
    const arrival = toItineraryActivityForm(vm.activities[1], vm);
    const saved = toItineraryUpdate({ ...vm, activities: [vm.activities[0], { ...arrival, time: '04:00' }] });
    assert.equal(saved.activities[0].time_utc, stored.activities[0].time_utc);
    assert.equal(saved.activities[0].time_zone, 'Asia/Taipei');
    assert.equal(saved.activities[1].time_utc, '2026-10-12T19:00:00.000Z');
    assert.equal(saved.activities[1].time_zone, 'Asia/Tokyo');
    assert.equal(saved.activities[1].time, '04:00');
});
test('changing an activity zone reinterprets only that activity local input', () => {
    const stored = toItineraryInsert(mixedZoneDay);
    const vm = toItineraryVM(stored, 'UTC');
    const arrival = toItineraryActivityForm(vm.activities[1], vm);
    const saved = toItineraryUpdate({ ...vm, activities: [vm.activities[0], { ...arrival, time_zone: 'Asia/Taipei' }] });
    assert.equal(saved.activities[0].time_utc, stored.activities[0].time_utc);
    assert.equal(saved.activities[1].time_utc, '2026-10-12T19:00:00.000Z');
    assert.equal(saved.activities[1].time_zone, 'Asia/Taipei');
});
test('one activity can opt into UTC while other activities and day retain legacy mode', () => {
    const old = { ...day.activities[0], title: '舊活動', time: '09:00' };
    const stored = toItineraryInsert({ ...day, is_utc: false, activities: [old, mixedZoneDay.activities[1]] });
    assert.equal(stored.is_utc, false);
    assert.equal(stored.date_utc, null);
    assert.deepEqual(stored.activities[0], old);
    assert.equal(stored.activities[1].time_utc, '2026-10-12T18:00:00.000Z');
    const vm = toItineraryVM(stored, 'UTC');
    assert.equal(vm.activities[0].time, '09:00');
    assert.equal(vm.activities[1].time, '18:00');
    const saved = toItineraryUpdate({ ...vm, title: '改標題' });
    assert.deepEqual(saved.activities[0], old);
    assert.equal(saved.activities[1].time_utc, stored.activities[1].time_utc);
    const ics = generateICS('旅行', [vm]);
    assert.match(ics, /DTSTART:20261012T090000\r\n/);
    assert.match(ics, /DTSTART:20261012T180000Z/);
});
test('old UTC activities without activity flags inherit the day zone for editing', () => {
    const stored = toItineraryInsert({ ...day, is_utc: true, time_zone: 'Asia/Taipei' });
    delete stored.activities[0].time_zone;
    const vm = toItineraryVM(stored, 'UTC');
    const form = toItineraryActivityForm(vm.activities[0], vm);
    assert.equal(form.is_utc, true);
    assert.equal(form.time_zone, 'Asia/Taipei');
    assert.equal(form.time, '00:30');
    assert.equal(form.time_date, '2026-10-12');
});
test('ICS exports UTC events with Z and correct midnight rollover; legacy remains floating', () => {
    const utcDay = toItineraryVM(toItineraryInsert({ ...day, is_utc: true, time_zone: 'Asia/Taipei' }));
    const utcICS = generateICS('旅行', [utcDay]);
    assert.match(utcICS, /DTSTART:20261011T163000Z/);
    assert.match(utcICS, /DTEND:20261011T173000Z/);
    const legacyICS = generateICS('旅行', [{ ...day, activities: [{ ...day.activities[0], time: '23:30' }] }]);
    assert.match(legacyICS, /DTSTART:20261012T233000\r\n/);
    assert.match(legacyICS, /DTEND:20261013T003000\r\n/);
});

function fakeDatabase(initial, failure) {
    const calls = [];
    const db = { from(table) {
        return { kind: 'read', payload: null,
            select() { return this; }, eq() { return this; },
            insert(payload) { this.kind = 'insert'; this.payload = payload; return this; },
            update(payload) { this.kind = 'update'; this.payload = payload; return this; },
            async single() {
                calls.push({ table, kind: this.kind, payload: this.payload });
                return this.kind === 'read' ? { data: initial, error: null }
                    : { data: { ...initial, ...this.payload }, error: failure || null };
            },
        };
    } };
    cache.set(path.resolve(__dirname, '../src/services/SupabaseClient.ts'), { exports: { supabaseClient: db } });
    for (const name of ['FlightRepo', 'ItineraryRepo']) cache.delete(path.resolve(__dirname, `../src/services/repositories/${name}.ts`));
    return calls;
}
test('flight repository sends UTC timestamps and preserves them on partial edits', async () => {
    const stored = toFlightStorage(flight);
    const calls = fakeDatabase(stored);
    const { flightRepo } = load('src/services/repositories/FlightRepo.ts');
    await flightRepo.insert(flight);
    assert.equal(calls[0].payload.departure_at_utc, stored.departure_at_utc);
    await flightRepo.update({ id: flight.id, code: 'BR999' });
    assert.equal(calls[1].kind, 'read');
    assert.equal(calls[2].payload.departure_at_utc, stored.departure_at_utc);
    assert.equal(calls[2].payload.arrival_at_utc, stored.arrival_at_utc);
    assert.equal(calls[2].payload.departure_time_zone, stored.departure_time_zone);
    assert.equal(calls[2].payload.arrival_time_zone, stored.arrival_time_zone);
    assert.equal(calls[2].payload.code, 'BR999');
});
test('repository reads and mutation results retain the DB airport zones', async () => {
    const stored = toFlightStorage(flight);
    fakeDatabase(stored);
    const { flightRepo } = load('src/services/repositories/FlightRepo.ts');
    for (const row of [await flightRepo.getById(flight.id), await flightRepo.insert(flight)]) {
        assert.equal(row.departure_time_zone, 'Asia/Taipei');
        assert.equal(row.arrival_time_zone, 'Asia/Tokyo');
        assert.equal(row.departure_time, '23:30');
        assert.equal(row.arrival_time, '03:00');
        assert.equal('display_time_zone' in row, false);
    }
});
test('missing UTC columns fail visibly without retrying a legacy-only write', async () => {
    const failure = { code: '42703', message: 'column is_utc does not exist' };
    const calls = fakeDatabase(flight, failure);
    const { flightRepo } = load('src/services/repositories/FlightRepo.ts');
    await assert.rejects(() => flightRepo.insert(flight), error => error === failure);
    assert.equal(calls.length, 1);
});
test('itinerary partial UTC edits merge the existing day and send canonical times', async () => {
    const stored = { ...toItineraryInsert({ ...day, is_utc: true, time_zone: 'Asia/Taipei' }), id: day.id };
    const calls = fakeDatabase(stored);
    const { itineraryRepo } = load('src/services/repositories/ItineraryRepo.ts');
    await itineraryRepo.update({ id: day.id, date: '2026-10-15', time_zone: 'UTC', activities: [{ ...day.activities[0], time: '09:00' }] });
    assert.equal(calls[0].kind, 'read');
    assert.equal(calls[1].payload.date_utc, '2026-10-15T00:00:00.000Z');
    assert.equal(calls[1].payload.activities[0].time_utc, '2026-10-15T09:00:00.000Z');
    assert.equal(calls[1].payload.day_number, day.day_number);
});

const instantActivity = (utc, extras = {}) => {
    const local = utcToLocal(utc, extras.display_time_zone || 'UTC');
    return { ...day.activities[0], is_utc: true, time_utc: utc, time: local.time, time_date: local.date,
        display_time_zone: 'UTC', ...extras };
};
test('timeline keeps a full 48-hour gap between matching clock times on different dates', () => {
    const schedule = computeDayTimelineSchedule([
        instantActivity('2026-10-12T10:00:00Z'), instantActivity('2026-10-14T10:00:00Z', { activityIndex: 1 }),
    ]);
    assert.equal(schedule[0].gapToNext.gapMinutes, 2880);
    assert.deepEqual(getTimelineConnection(schedule[0], schedule[1]), { gapMinutes: 2880, delayMinutes: 0 });
});
test('a next-day activity with an earlier clock time is a gap rather than a false delay', () => {
    const schedule = computeDayTimelineSchedule([
        instantActivity('2026-10-12T23:30:00Z'), instantActivity('2026-10-13T22:00:00Z', { activityIndex: 1 }),
    ]);
    assert.deepEqual(getTimelineConnection(schedule[0], schedule[1]), { gapMinutes: 1350, delayMinutes: 0 });
});
test('actual travel overlaps are detected across midnight using full instants', () => {
    const schedule = computeDayTimelineSchedule([
        instantActivity('2026-10-12T23:30:00Z', { duration: '1小時', transitDuration: '30分鐘', transitMode: 'flight' }),
        instantActivity('2026-10-13T00:45:00Z', { activityIndex: 1 }),
    ]);
    assert.equal(schedule[0].endTime, '00:30');
    assert.equal(schedule[0].endDate, '2026-10-13');
    assert.equal(schedule[0].transit.arrivalTime, '01:00');
    assert.equal(schedule[0].transit.arrivalDate, '2026-10-13');
    assert.deepEqual(getTimelineConnection(schedule[0], schedule[1]), { gapMinutes: 0, delayMinutes: 15 });
});
test('DST fold sorting uses UTC even when the later instant has an earlier local clock', () => {
    const earlier = instantActivity('2026-11-01T05:50:00Z', { activityIndex: 0, display_time_zone: 'America/New_York' });
    const later = instantActivity('2026-11-01T06:10:00Z', { activityIndex: 1, display_time_zone: 'America/New_York' });
    assert.equal(earlier.time, '01:50');
    assert.equal(later.time, '01:10');
    assert.ok(compareItineraryActivities(earlier, later) < 0);
    const vm = toItineraryVM({ ...day, is_utc: true, activities: [later, earlier] }, 'America/New_York');
    assert.deepEqual(vm.activities.map(a => a.activityIndex), [0, 1]);
    const schedule = computeDayTimelineSchedule(vm.activities, vm);
    assert.equal(schedule[0].gapToNext.gapMinutes, 20);
    assert.equal(getTimelineConnection(schedule[0], schedule[1]).delayMinutes, 0);
});
test('elapsed durations render correct local end times across DST clock changes', () => {
    const [spring] = computeDayTimelineSchedule([instantActivity('2026-03-08T06:30:00Z', {
        display_time_zone: 'America/New_York', duration: '1小時',
    })]);
    assert.equal(spring.startTime, '01:30');
    assert.equal(spring.endTime, '03:30');
    assert.equal(spring.endAtMs - spring.startAtMs, 3600000);
    const [fall] = computeDayTimelineSchedule([instantActivity('2026-11-01T05:30:00Z', {
        display_time_zone: 'America/New_York', duration: '1小時',
    })]);
    assert.equal(fall.startTime, '01:30');
    assert.equal(fall.endTime, '01:30');
    assert.equal(fall.endAtMs - fall.startAtMs, 3600000);
});
test('changing display zones changes labels while preserving gaps and UTC ordering', () => {
    const stored = toItineraryInsert(mixedZoneDay);
    for (const zone of ['UTC', 'Asia/Taipei', 'Asia/Tokyo', 'America/New_York']) {
        const vm = toItineraryVM(stored, zone);
        const schedule = computeDayTimelineSchedule(vm.activities, vm);
        assert.equal(getTimelineConnection(schedule[0], schedule[1]).gapMinutes, 150);
        assert.equal(schedule[0].startAtMs, Date.parse('2026-10-12T15:30:00Z'));
    }
});
test('legacy clock-only overnight schedules keep their historical midnight rollover', () => {
    const schedule = computeDayTimelineSchedule([
        { ...day.activities[0], time: '23:30', duration: '30分鐘' },
        { ...day.activities[0], activityIndex: 1, time: '01:00' },
    ], { date: '2026-10-12', is_utc: false });
    assert.equal(schedule[0].endTime, '00:00');
    assert.equal(getTimelineConnection(schedule[0], schedule[1]).gapMinutes, 60);
});
test('DAY grouping date and legacy zone fields survive display-zone changes', () => {
    const stored = { ...toItineraryInsert(mixedZoneDay), date_utc: '2026-10-11T16:00:00Z' };
    const vm = toItineraryVM(stored, 'America/Los_Angeles');
    assert.equal(vm.date, stored.date);
    const saved = toItineraryUpdate({ ...vm, title: '只改標題' });
    assert.equal(saved.time_zone, stored.time_zone);
    assert.equal(saved.date_utc, stored.date_utc);
    assert.deepEqual(saved.activities.map(a => a.time_utc), stored.activities.map(a => a.time_utc));
});

test('an unsaved UTC activity sorts using its selected source zone', () => {
    const unsaved = { ...day.activities[0], is_utc: true, time_zone: 'Asia/Taipei', time_date: '2026-10-12', time: '09:00' };
    const saved = instantActivity('2026-10-12T02:00:00Z');
    assert.ok(compareItineraryActivities(unsaved, saved, day) < 0);
});
test('timeline connector renders a 48-hour free gap without inventing a transit leg', () => {
    const { renderToStaticMarkup } = require('react-dom/server');
    const React = require('react');
    const { TransitConnectorNode } = load('src/components/itinerary/timeline/TransitConnectorNode.tsx');
    const schedule = computeDayTimelineSchedule([
        instantActivity('2026-10-12T10:00:00Z'), instantActivity('2026-10-14T10:00:00Z'),
    ]);
    const connection = getTimelineConnection(schedule[0], schedule[1]);
    const html = renderToStaticMarkup(React.createElement(TransitConnectorNode, {
        transit: schedule[0].transit, freeGapMinutes: connection.gapMinutes,
        delayMinutes: connection.delayMinutes, isLateConflict: false,
    }));
    assert.match(html, /自由活動 48 小時/);
    assert.doesNotMatch(html, /抵達|延誤/);
});
test('timeline connector includes the next date for overnight transport arrivals', () => {
    const { renderToStaticMarkup } = require('react-dom/server');
    const React = require('react');
    const { TransitConnectorNode } = load('src/components/itinerary/timeline/TransitConnectorNode.tsx');
    const [schedule] = computeDayTimelineSchedule([instantActivity('2026-10-12T23:30:00Z', {
        transitMode: 'flight', transitDuration: '1小時',
    })]);
    const html = renderToStaticMarkup(React.createElement(TransitConnectorNode, {
        transit: schedule.transit, freeGapMinutes: 0, delayMinutes: 0, isLateConflict: false,
    }));
    assert.match(html, /2026-10-13/);
    assert.match(html, /00:30/);
});
