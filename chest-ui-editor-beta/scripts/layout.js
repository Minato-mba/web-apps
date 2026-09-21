/**
 * Shared Bedrock JSON UI geometry helpers.
 *
 * Component x/y values are Bedrock offsets, not CSS top/left coordinates.
 * The rendered top-left is derived from anchor_to (parent), anchor_from
 * (component), offset, and component size.
 */
const jsonUiLayout = {
    DEFAULT_PARENT_WIDTH: 162,
    DEFAULT_PARENT_HEIGHT: 54,
    DEFAULT_ANCHOR: 'top_left',
    anchors: {
        top_left: [0, 0],
        top_middle: [0.5, 0],
        top_right: [1, 0],
        left_middle: [0, 0.5],
        center: [0.5, 0.5],
        right_middle: [1, 0.5],
        bottom_left: [0, 1],
        bottom_middle: [0.5, 1],
        bottom_right: [1, 1]
    },

    normalizeNumber: function (value, fallback = 0) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    },

    normalizeComponent: function (component) {
        if (!component) return component;
        component.anchor_from = this.anchors[component.anchor_from]
            ? component.anchor_from
            : this.DEFAULT_ANCHOR;
        component.anchor_to = this.anchors[component.anchor_to]
            ? component.anchor_to
            : this.DEFAULT_ANCHOR;
        component.x = this.normalizeNumber(component.x);
        component.y = this.normalizeNumber(component.y);
        component.width = Math.max(1, this.normalizeNumber(component.width, 1));
        component.height = Math.max(1, this.normalizeNumber(component.height, 1));
        return component;
    },

    getParentSize: function (container, fallbackHeight = null) {
        const width = container?.clientWidth || container?.offsetWidth || this.DEFAULT_PARENT_WIDTH;
        const height = container?.clientHeight || container?.offsetHeight ||
            fallbackHeight || this.DEFAULT_PARENT_HEIGHT;
        return {
            width: this.normalizeNumber(width, this.DEFAULT_PARENT_WIDTH),
            height: this.normalizeNumber(height, this.DEFAULT_PARENT_HEIGHT)
        };
    },

    getTopLeft: function (component, parentSize) {
        this.normalizeComponent(component);
        const parent = parentSize || {
            width: this.DEFAULT_PARENT_WIDTH,
            height: this.DEFAULT_PARENT_HEIGHT
        };
        const from = this.anchors[component.anchor_from];
        const to = this.anchors[component.anchor_to];
        return {
            left: (to[0] * parent.width) + component.x - (from[0] * component.width),
            top: (to[1] * parent.height) + component.y - (from[1] * component.height)
        };
    },

    setAnchorsPreservingPosition: function (component, anchorFrom, anchorTo, parentSize) {
        this.normalizeComponent(component);
        const topLeft = this.getTopLeft(component, parentSize);
        component.anchor_from = this.anchors[anchorFrom] ? anchorFrom : this.DEFAULT_ANCHOR;
        component.anchor_to = this.anchors[anchorTo] ? anchorTo : this.DEFAULT_ANCHOR;

        const from = this.anchors[component.anchor_from];
        const to = this.anchors[component.anchor_to];
        component.x = this.round(topLeft.left + (from[0] * component.width) - (to[0] * parentSize.width));
        component.y = this.round(topLeft.top + (from[1] * component.height) - (to[1] * parentSize.height));
    },

    applyToElement: function (element, component, container) {
        if (!element || !component) return;
        const position = this.getTopLeft(component, this.getParentSize(container || element.parentElement));
        element.style.left = `${position.left}px`;
        element.style.top = `${position.top}px`;
        element.dataset.anchorFrom = component.anchor_from;
        element.dataset.anchorTo = component.anchor_to;
    },

    getPlacement: function (component) {
        this.normalizeComponent(component);
        return {
            anchor_from: component.anchor_from,
            anchor_to: component.anchor_to,
            offset: [this.round(component.x), this.round(component.y)]
        };
    },

    round: function (value) {
        return Math.round(this.normalizeNumber(value) * 1000) / 1000;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = jsonUiLayout;
}