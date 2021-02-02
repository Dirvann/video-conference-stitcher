"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class GridLayout {
    getBoxes(n, size) {
        const side = n <= 9 ? 3 : Math.ceil(Math.sqrt(n));
        const out = [];
        for (let y = 0; y < side; y++) {
            for (let x = 0; x < side; x++) {
                out.push({
                    w: size.w / side,
                    h: size.h / side,
                    x: x * (size.w / side),
                    y: y * (size.h / side)
                });
            }
        }
        return out;
    }
}
exports.default = GridLayout;
//# sourceMappingURL=GridLayout.js.map