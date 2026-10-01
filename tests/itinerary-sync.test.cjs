const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const source = path.resolve(__dirname, '../src/utils/ItinerarySyncUtil.ts');
const compiled = ts.transpileModule(fs.readFileSync(source, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
const mod = new Module(source, module);
mod.filename = source;
mod.paths = module.paths;
mod._compile(compiled, source);
const { planItinerarySync, planSafeDayRenumbering, getItinerarySyncErrorMessage } = mod.exports;
const trip = { id: 'trip', user_id: 'owner', start_date: '2026-10-01', end_date: '2026-10-03' };
const day = (date, day_number = 99) => ({ id: date, date, day_number, trip_id: trip.id, user_id: trip.user_id, title: '保留標題', weekday: 'Thu', activities: [{ title: '保留活動' }] });
test('new trip creates inclusive dates and weekday labels', () => {
    const result = planItinerarySync(trip, []);
    assert.deepEqual(result.inserts.map(d => [d.date, d.day_number, d.weekday]), [['2026-10-01', 1, 'Thu'], ['2026-10-02', 2, 'Fri'], ['2026-10-03', 3, 'Sat']]);
    assert.ok(result.inserts.every(d => d.trip_id === trip.id && d.user_id === trip.user_id));
});
test('fills date gaps and only patches day numbers without changing existing data', () => {
    const existing = [day('2026-10-03'), day('2026-10-01')];
    const before = JSON.stringify(existing);
    const result = planItinerarySync(trip, existing);
    assert.deepEqual(result.updates, [{ id: '2026-10-03', day_number: 3 }, { id: '2026-10-01', day_number: 1 }]);
    assert.deepEqual(result.inserts.map(d => [d.date, d.day_number]), [['2026-10-02', 2]]);
    assert.equal(JSON.stringify(existing), before);
});
test('repeated synchronization is a no-op', () => {
    const existing = [day('2026-10-01',1), day('2026-10-02',2), day('2026-10-03',3)];
    const result = planItinerarySync(trip, existing);
    assert.deepEqual(result.updates, []);
    assert.deepEqual(result.inserts, []);
});
test('changed start date deletes out of range days and renumbers remaining days', () => {
    const result = planItinerarySync({ ...trip, start_date: '2026-10-02' }, [day('2026-10-01',1), day('2026-10-02',2), day('2026-10-03',3)]);
    assert.deepEqual(result.updates.map(d => d.day_number), [1,2]);
    assert.deepEqual(result.deletes,['2026-10-01']);
    assert.deepEqual(result.inserts, []);
});
test('handles same-day trips and leap-day boundaries', () => {
    assert.equal(planItinerarySync({ ...trip, end_date: trip.start_date }, []).inserts.length,1);
    assert.deepEqual(planItinerarySync({ ...trip, start_date:'2028-02-28', end_date:'2028-03-01' }, []).inserts.map(d=>d.date), ['2028-02-28','2028-02-29','2028-03-01']);
});
test('rejects missing, invalid, or reversed dates', () => {
    for (const invalid of [{ start_date:null }, { end_date:'2026-02-30' }, { end_date:'2026-09-30' }]) {
        assert.throws(() => planItinerarySync({ ...trip,...invalid }, []));
    }
});

test('deletes dates before and after the range while preserving both boundary days', () => {
    const existing = [day('2026-09-30'), day('2026-10-01',1), day('2026-10-03',3), day('2026-10-04')];
    const before = JSON.stringify(existing);
    const result = planItinerarySync(trip, existing);
    assert.deepEqual(result.deletes, ['2026-09-30', '2026-10-04']);
    assert.deepEqual(result.updates, []);
    assert.deepEqual(result.inserts.map(d => d.date), ['2026-10-02']);
    assert.equal(JSON.stringify(existing), before);
});
test('a shifted non-overlapping trip deletes old days and creates the new date range', () => {
    const result = planItinerarySync({ ...trip, start_date:'2026-10-10', end_date:'2026-10-11' }, [day('2026-10-01'),day('2026-10-02')]);
    assert.deepEqual(result.deletes, ['2026-10-01','2026-10-02']);
    assert.deepEqual(result.updates, []);
    assert.deepEqual(result.inserts.map(d => [d.date,d.day_number]), [['2026-10-10',1],['2026-10-11',2]]);
});

function loadSyncService(existing, writeError = null) {
    const calls = [];
    const servicePath = path.resolve(__dirname, '../src/services/ItinerarySyncService.ts');
    const service = new Module(servicePath, module);
    service.filename = servicePath;
    service.paths = module.paths;
    service.require = name => {
        if (name === '../utils/ItinerarySyncUtil') return { planItinerarySync,planSafeDayRenumbering };
        if (name === './repositories/ItineraryRepo') return { itineraryRepo: { list: async id => { calls.push(['list',id]); return existing; } } };
        if (name === './SupabaseClient') return { supabaseClient: { from(table) {
            const query = {
                update(payload) { calls.push(['update',table,payload]); return this; },
                insert(payload) { calls.push(['insert',table,payload]); return this; },
                delete() { calls.push(['delete',table]); return this; },
                eq(key,value) { calls.push(['eq',key,value]); return this; },
                in(key,value) { calls.push(['in',key,value]); return this; },
                then(resolve,reject) { return Promise.resolve({ error:writeError }).then(resolve,reject); }
            };
            return query;
        } } };
        throw new Error('Unexpected dependency: '+name);
    };
    service._compile(ts.transpileModule(fs.readFileSync(servicePath,'utf8'), { compilerOptions: { module:ts.ModuleKind.CommonJS } }).outputText, servicePath);
    return { sync: service.exports.syncTripItineraryDays, calls };
}
test('service restricts deletion to this trip and the planned out of range IDs', async () => {
    const { sync,calls } = loadSyncService([day('2026-09-30'),day('2026-10-01',1),day('2026-10-03',3),day('2026-10-04')]);
    assert.deepEqual(await sync(trip), { added:1,updated:0,removed:2 });
    const deleteIndex = calls.findIndex(call => call[0] === 'delete');
    assert.deepEqual(calls.slice(deleteIndex,deleteIndex+3), [['delete','itinerary_days'],['eq','trip_id','trip'],['in','id',['2026-09-30','2026-10-04']]]);
    assert.ok(deleteIndex < calls.findIndex(call => call[0] === 'insert'));
});
test('service validates dates before any write or delete', async () => {
    const { sync,calls } = loadSyncService([day('2026-09-30')]);
    await assert.rejects(() => sync({ ...trip,end_date:'2026-09-29' }));
    assert.deepEqual(calls,[['list','trip']]);
});
test('service propagates a deletion failure for the existing retry flow', async () => {
    const failure = new Error('Delete denied');
    const { sync } = loadSyncService([day('2026-09-30'),day('2026-10-01',1),day('2026-10-02',2),day('2026-10-03',3)],failure);
    await assert.rejects(() => sync(trip), failure);
});
function loadConstrainedService(initialRows, beforeInsert) {
    const state = { rows: structuredClone(initialRows), calls: [], lists: 0, conflicts: 0 };
    const servicePath = path.resolve(__dirname, '../src/services/ItinerarySyncService.ts');
    const service = new Module(servicePath, module);
    service.filename = servicePath;
    service.paths = module.paths;
    const conflict = () => { state.conflicts++; return { error: { code:'23505',message:'duplicate key value violates unique constraint "itinerary_days_trip_id_day_number_key"' } }; };
    const db = { from(table) {
        assert.equal(table,'itinerary_days');
        const query = {
            filters: [],
            update(payload) { this.type='update';this.payload=payload;return this; },
            insert(payload) { this.type='insert';this.payload=payload;return this; },
            delete() { this.type='delete';return this; },
            eq(key,value) { this.filters.push(row=>row[key]===value);return this; },
            in(key,values) { this.filters.push(row=>values.includes(row[key]));return this; },
            async execute() {
                state.calls.push({ type:this.type,payload:this.payload });
                const matches = row => this.filters.every(filter=>filter(row));
                if(this.type==='delete') {
                    state.rows=state.rows.filter(row=>!matches(row));
                } else if(this.type==='update') {
                    const target=state.rows.find(matches);
                    assert.ok(target);
                    if(state.rows.some(row=>row.id!==target.id && row.trip_id===target.trip_id && row.day_number===this.payload.day_number)) return conflict();
                    Object.assign(target,this.payload);
                } else if(this.type==='insert') {
                    if(beforeInsert) await beforeInsert(state,this.payload);
                    if(this.payload.some(candidate=>state.rows.some(row=>row.trip_id===candidate.trip_id && (row.day_number===candidate.day_number || row.date===candidate.date)))) return conflict();
                    state.rows.push(...this.payload.map(row=>({...row,id:'insert-'+row.date})));
                }
                return { error:null };
            },
            then(resolve,reject) { return this.execute().then(resolve,reject); }
        };
        return query;
    } };
    service.require=name=> {
        if(name==='../utils/ItinerarySyncUtil') return { planItinerarySync,planSafeDayRenumbering };
        if(name==='./SupabaseClient') return { supabaseClient:db };
        if(name==='./repositories/ItineraryRepo') return { itineraryRepo: { list:async id=>{ state.lists++; return structuredClone(state.rows.filter(row=>row.trip_id===id)); } } };
        throw Error('Unexpected dependency '+name);
    };
    service._compile(ts.transpileModule(fs.readFileSync(servicePath,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,servicePath);
    return { state,sync:service.exports.syncTripItineraryDays };
}
test('uniqueness: a later start deletes the occupied Day 1 before renumbering',async()=>{
    const {state,sync}=loadConstrainedService([day('2026-10-01',1),day('2026-10-02',2),day('2026-10-03',3)]);
    assert.deepEqual(await sync({...trip,start_date:'2026-10-02'}),{added:0,updated:2,removed:1});
    assert.deepEqual(state.rows.map(row=>[row.date,row.day_number]),[['2026-10-02',1],['2026-10-03',2]]);
    assert.equal(state.conflicts,0);
    assert.equal(state.calls[0].type,'delete');
});
test('uniqueness: an earlier start renumbers in the order that releases occupied targets',async()=>{
    const existing=[day('2026-10-02',1),day('2026-10-03',2)];
    const {state,sync}=loadConstrainedService(existing);
    assert.deepEqual(await sync(trip),{added:1,updated:2,removed:0});
    assert.equal(state.conflicts,0);
    assert.deepEqual(state.rows.filter(row=>!row.id.startsWith('insert')).map(row=>[row.date,row.day_number,row.activities]),existing.map((row,index)=>[row.date,index+2,row.activities]));
    assert.equal(state.rows.find(row=>row.date==='2026-10-01').day_number,1);
});
test('uniqueness: swapped manual numbers are corrected without changing dates or activities',async()=>{
    const existing=[day('2026-10-01',2),day('2026-10-02',1),day('2026-10-03',3)];
    const {state,sync}=loadConstrainedService(existing);
    assert.deepEqual(await sync(trip),{added:0,updated:2,removed:0});
    assert.equal(state.conflicts,0);
    assert.deepEqual(state.rows.map(row=>[row.date,row.day_number,row.activities]),existing.map((row,index)=>[row.date,index+1,row.activities]));
    assert.ok(state.calls.some(call=>call.type==='update'&&call.payload.day_number>3));
});
test('uniqueness: moving the entire range releases old numbers before creating new days',async()=>{
    const other={...day('2026-10-10',1),id:'other-day',trip_id:'other-trip'};
    const {state,sync}=loadConstrainedService([day('2026-10-01',1),day('2026-10-02',2),other]);
    assert.deepEqual(await sync({...trip,start_date:'2026-10-10',end_date:'2026-10-11'}),{added:2,updated:0,removed:2});
    assert.equal(state.conflicts,0);
    assert.deepEqual(state.rows.find(row=>row.trip_id==='other-trip'),other);
});
test('concurrent automatic and manual syncs are serialized for the same trip',async()=>{
    const {state,sync}=loadConstrainedService([]);
    const results=await Promise.all([sync(trip),sync(trip)]);
    assert.deepEqual(results,[{added:3,updated:0,removed:0},{added:0,updated:0,removed:0}]);
    assert.equal(state.rows.length,3);
    assert.equal(state.conflicts,0);
});
test('a concurrent remote insert is recovered by rereading before one retry',async()=>{
    let injected=false;
    const {state,sync}=loadConstrainedService([], (state,payload)=>{
        if(!injected) { injected=true;state.rows.push({...payload[0],id:'remote-day'}); }
    });
    assert.deepEqual(await sync(trip),{added:2,updated:0,removed:0});
    assert.equal(state.lists,2);
    assert.equal(state.conflicts,1);
    assert.equal(state.rows.length,3);
});
test('duplicate dates are rejected before destructive synchronization',async()=>{
    const existing=[day('2026-10-01',1),{...day('2026-10-01',2),id:'duplicate'}];
    const {state,sync}=loadConstrainedService(existing);
    await assert.rejects(()=>sync(trip),/同一日期存在多筆日程/);
    assert.deepEqual(state.calls,[]);
});
test('plain Supabase error objects expose the actual constraint and error code',()=>{
    const message=getItinerarySyncErrorMessage({code:'23505',message:'duplicate key itinerary_days_trip_id_day_number_key'});
    assert.match(message,/23505/);
    assert.match(message,/itinerary_days_trip_id_day_number_key/);
});
