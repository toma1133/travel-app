const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const ts = require('typescript');
const test = require('node:test');
const assert = require('node:assert/strict');
const source = path.resolve(__dirname, '../src/utils/BackgroundTaskUtil.ts');
const mod = new Module(source, module);
mod.filename = source;
mod.paths = module.paths;
mod._compile(ts.transpileModule(fs.readFileSync(source, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, source);
const { scheduleBackgroundTask } = mod.exports;

test('map initialization waits for idle time and has a bounded wait', () => {
    let queued;
    let options;
    let started = false;
    global.window = { requestIdleCallback(callback, value) { queued = callback; options = value; return 42; }, cancelIdleCallback() {} };
    scheduleBackgroundTask(() => { started = true; });
    assert.equal(started, false);
    assert.deepEqual(options, { timeout: 1500 });
    queued();
    assert.equal(started, true);
});

test('leaving the page cancels pending idle initialization', () => {
    let cancelled;
    global.window = { requestIdleCallback() { return 42; }, cancelIdleCallback(id) { cancelled = id; } };
    const cleanup = scheduleBackgroundTask(() => assert.fail('must not initialize'));
    cleanup();
    assert.equal(cancelled, 42);
});

test('browsers without idle callbacks defer work with a cancellable timer', () => {
    let queued;
    let delay;
    let cancelled;
    let started = false;
    global.window = { setTimeout(callback, ms) { queued = callback; delay = ms; return 9; }, clearTimeout(id) { cancelled = id; } };
    const cleanup = scheduleBackgroundTask(() => { started = true; });
    assert.equal(started, false);
    assert.equal(delay, 150);
    queued();
    assert.equal(started, true);
    cleanup();
    assert.equal(cancelled, 9);
});
