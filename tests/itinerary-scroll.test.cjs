const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const ts = require('typescript');
const test = require('node:test');
const assert = require('node:assert/strict');
const source = path.resolve(__dirname, '../src/utils/ItineraryScrollUtil.ts');
const mod = new Module(source, module);
mod.filename = source;
mod.paths = module.paths;
mod._compile(ts.transpileModule(fs.readFileSync(source, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, source);
const { scrollToItineraryDay, updateItineraryScrollSpace } = mod.exports;
function container(scrollTop, top = 100, clientTop = 0) {
    return { scrollTop, clientTop, calls: [], getBoundingClientRect: () => ({ top }), scrollTo(options) { this.calls.push(options); this.scrollTop = options.top; } };
}
test('uses the committed position after the previous long day collapses', () => {
    const scroller = container(1000);
    // The target moved to content offset 200 after the previous day collapsed.
    const day = { getBoundingClientRect: () => ({ top: 100 + 200 - scroller.scrollTop }) };
    scrollToItineraryDay(scroller, day);
    assert.equal(scroller.scrollTop, 200);
    assert.equal(day.getBoundingClientRect().top, scroller.getBoundingClientRect().top);
    assert.equal(scroller.calls[0].behavior, 'instant');
});
test('rapidly switching days replaces the previous destination using current layout', () => {
    const scroller = container(0);
    let offset = 1400;
    const day = { getBoundingClientRect: () => ({ top: 100 + offset - scroller.scrollTop }) };
    scrollToItineraryDay(scroller, day);
    offset = 400;
    scrollToItineraryDay(scroller, day);
    assert.deepEqual(scroller.calls, [{ top: 1400, behavior: 'instant' }, { top: 400, behavior: 'instant' }]);
    assert.equal(day.getBoundingClientRect().top, 100);
});
test('aligns with the inner edge of bordered scroll containers and clamps the first day', () => {
    const scroller = container(300, 100, 2);
    scrollToItineraryDay(scroller, { getBoundingClientRect: () => ({ top: 252 }) });
    assert.equal(scroller.scrollTop, 450);
    scrollToItineraryDay(scroller, { getBoundingClientRect: () => ({ top: -500 }) });
    assert.equal(scroller.scrollTop, 0);
});

// Model native scroll limits so aligning a short last day fails without sufficient space.
global.getComputedStyle = element => ({ paddingBottom: String(element.bottomPadding || 0) });
function layout({ end = 1288, target = 1200, height = 600, padding = 112, oldSpace = 0 } = {}) {
    const scroller = container(0);
    scroller.clientHeight = height;
    scroller.bottomPadding = padding;
    const spacer = { style: { height: oldSpace + 'px' }, getBoundingClientRect: () => ({ top: 100 + end - scroller.scrollTop }) };
    Object.defineProperty(scroller, 'scrollHeight', { get: () => end + padding + Number.parseFloat(spacer.style.height || 0) });
    scroller.scrollTo = function(options) {
        this.calls.push(options);
        this.scrollTop = Math.max(0, Math.min(options.top, this.scrollHeight - this.clientHeight));
    };
    const day = { getBoundingClientRect: () => ({ top: 100 + target - scroller.scrollTop }) };
    return { scroller, spacer, day };
}
test('a long last day needs no extra blank space and still aligns correctly', () => {
    const { scroller, spacer, day } = layout({ target: 500, oldSpace: 600 });
    scrollToItineraryDay(scroller, day, spacer);
    assert.equal(spacer.style.height, '0px');
    assert.equal(day.getBoundingClientRect().top, 100);
});
test('a short last day reserves only the missing range after navigation padding', () => {
    const { scroller, spacer, day } = layout();
    scrollToItineraryDay(scroller, day, spacer);
    assert.equal(spacer.style.height, '400px');
    assert.equal(day.getBoundingClientRect().top, 100);
    // Recalculation does not accumulate padding or reset the scroll position.
    assert.equal(updateItineraryScrollSpace(scroller, day, spacer), 400);
    assert.equal(scroller.scrollTop, 1200);
});
test('viewport changes and selecting an earlier day remove excess space', () => {
    const { scroller, spacer, day } = layout();
    scrollToItineraryDay(scroller, day, spacer);
    scroller.clientHeight = 400;
    assert.equal(updateItineraryScrollSpace(scroller, day, spacer), 200);
    const earlier = { getBoundingClientRect: () => ({ top: 100 + 500 - scroller.scrollTop }) };
    scrollToItineraryDay(scroller, earlier, spacer);
    assert.equal(spacer.style.height, '0px');
    assert.equal(earlier.getBoundingClientRect().top, 100);
    assert.equal(updateItineraryScrollSpace(scroller, null, spacer), 0);
});
