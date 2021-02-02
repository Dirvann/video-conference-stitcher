"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class User {
    constructor(id, media, name) {
        this.id = id;
        this.name = name || id.toString();
        media.forEach(med => {
            med.user = this;
        });
        this.media = media;
    }
}
exports.default = User;
//# sourceMappingURL=User.js.map