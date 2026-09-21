const assert = require('node:assert/strict');
const layout = require('../scripts/layout.js');

const parent = { width: 162, height: 54 };

for (const anchorFrom of Object.keys(layout.anchors)) {
    for (const anchorTo of Object.keys(layout.anchors)) {
        const component = {
            x: 13.5,
            y: -4.25,
            width: 18,
            height: 12,
            anchor_from: 'top_left',
            anchor_to: 'top_left'
        };
        const before = layout.getTopLeft(component, parent);
        layout.setAnchorsPreservingPosition(component, anchorFrom, anchorTo, parent);
        const after = layout.getTopLeft(component, parent);
        assert.equal(after.left, before.left, `${anchorFrom} -> ${anchorTo} changed X`);
        assert.equal(after.top, before.top, `${anchorFrom} -> ${anchorTo} changed Y`);
    }
}

const centered = {
    x: 0,
    y: 0,
    width: 20,
    height: 10,
    anchor_from: 'center',
    anchor_to: 'center'
};
assert.deepEqual(layout.getTopLeft(centered, { width: 100, height: 80 }), {
    left: 40,
    top: 35
});

centered.width = 40;
centered.height = 20;
assert.deepEqual(layout.getTopLeft(centered, { width: 100, height: 80 }), {
    left: 30,
    top: 30
});

assert.deepEqual(layout.getPlacement(centered), {
    anchor_from: 'center',
    anchor_to: 'center',
    offset: [0, 0]
});

console.log('layout.test.js: all anchor geometry tests passed');