const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const ts = require('typescript');
const test = require('node:test');
const assert = require('node:assert/strict');

// Exercise the basemap event lifecycle without WebGL or network access.
function harness(type = 'raster') {
    const state = [];
    let cursor = 0;
    let cleanup;
    let effectDependencies;
    let pendingEffect;
    let timer;
    let timerCancelled = false;
    const react = {
        lazy: () => 'VectorLayer', Suspense: 'Suspense',
        useCallback: callback => callback,
        useState(initial) {
            const index = cursor++;
            if (!(index in state)) state[index] = initial;
            return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
        },
        useEffect(callback, dependencies) {
            if (!effectDependencies || dependencies.some((value, index) => value !== effectDependencies[index])) {
                effectDependencies = dependencies;
                pendingEffect = callback;
            }
        },
    };
    global.window = { setTimeout(callback, ms) { assert.equal(ms, 15000); timer = callback; return 1; }, clearTimeout() { timerCancelled = true; } };
    const source = path.resolve(__dirname, '../src/components/place/MapBasemap.tsx');
    const mod = new Module(source, module);
    mod.filename = source;
    mod.paths = module.paths;
    mod.require = name => {
        if (name === 'react') return react;
        if (name === 'react/jsx-runtime') return { Fragment: 'Fragment', jsx: element, jsxs: element };
        if (name === 'react-leaflet') return { TileLayer: 'TileLayer' };
        if (name === 'lucide-react') return { Loader2: 'Loader2', RefreshCw: 'RefreshCw' };
        throw new Error(`Unexpected import: ${name}`);
    };
    function element(type, props, key) { return { type, props, key: key == null ? undefined : String(key) }; }
    mod._compile(ts.transpileModule(fs.readFileSync(source, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, source);
    let previousKey;
    function render() {
        cursor = 0;
        const attempt = mod.exports.default({ type, url: 'tiles', attribution: 'test' });
        if (previousKey !== attempt.key) {
            cleanup?.();
            state.splice(1);
            effectDependencies = undefined;
            previousKey = attempt.key;
        }
        const tree = attempt.type(attempt.props);
        if (pendingEffect) { cleanup?.(); cleanup = pendingEffect(); pendingEffect = undefined; }
        return { tree, attempt };
    }
    return { render, wait: () => timer(), unmount: () => cleanup?.(), cancelled: () => timerCancelled };
}

test('raster map shows loading until a tile arrives, then cancels the slow timer', () => {
    const map = harness();
    const first = map.render().tree.props.children;
    assert.ok(first[1]);
    first[0].props.eventHandlers.tileload();
    assert.equal(map.render().tree.props.children[1], false);
    assert.equal(map.cancelled(), true);
});

test('slow or failed loading offers a retry which remounts only the basemap', () => {
    const map = harness();
    map.render();
    map.wait();
    let result = map.render();
    let badge = result.tree.props.children[1].props.children;
    assert.match(badge.props.children[1].props.children, /網路較慢/);
    badge.props.children[2].props.onClick();
    result = map.render();
    assert.equal(result.attempt.key, '1');
    const tiles = result.tree.props.children[0];
    tiles.props.eventHandlers.tileerror();
    badge = map.render().tree.props.children[1].props.children;
    assert.match(badge.props.children[1].props.children, /無法載入/);
    tiles.props.eventHandlers.tileload();
    assert.equal(map.render().tree.props.children[1], false);
});

test('vector readiness clears loading and unmount cancels outstanding timeout', () => {
    const map = harness('vector');
    const layer = map.render().tree.props.children[0].props.children;
    layer.props.onReady();
    assert.equal(map.render().tree.props.children[1], false);
    const waitingMap = harness('vector');
    waitingMap.render();
    waitingMap.unmount();
    assert.equal(waitingMap.cancelled(), true);
});
