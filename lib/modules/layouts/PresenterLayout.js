"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class PresenterLayout {
    getBoxes(n, size) {
        if (n === 1) {
            return [{
                    w: size.w,
                    h: size.h,
                    x: 0,
                    y: 0
                }];
        }
        const out = [];
        out.push({
            w: size.w,
            h: size.h / 2,
            x: 0,
            y: 0
        });
        const side = n - 1 <= 4 ? 2 : Math.ceil(Math.sqrt(n - 1));
        for (let y = 0; y < side; y++) {
            for (let x = 0; x < side; x++) {
                out.push({
                    w: size.w / side,
                    h: size.h / side / 2,
                    x: x * (size.w / side),
                    y: y * (size.h / side / 2) + size.h / 2
                });
            }
        }
        return out;
    }
}
exports.default = PresenterLayout;
//# sourceMappingURL=PresenterLayout.js.map