"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
class Media {
    /**
     *
     * @param path
     * @param startTime time in milliseconds
     * @param hasVideo
     * @param hasAudio
     */
    constructor(path, startTime, hasVideo, hasAudio) {
        this.user = null;
        this.id = -1;
        this.duration = -1;
        this.audioChannels = -1;
        this.initialized = false;
        this.path = path;
        if (!(hasAudio || hasVideo))
            throw new Error('media must contain audio or video');
        this.hasAudio = hasAudio;
        this.hasVideo = hasVideo;
        this.startTime = startTime;
    }
    init() {
        // TODO not looking for stream channels if doesn't contain audio.
        // Would it work with just audio files?
        return new Promise((resolve, reject) => {
            Promise.all([this.getEntry('format=duration'), this.hasAudio ? this.getEntry('stream=channels') : '-1'])
                .then(([duration, channels]) => {
                this.duration = Math.round(parseFloat(duration) * 1000);
                this.audioChannels = parseInt(channels, 10);
                this.initialized = true;
                resolve();
            })
                .catch((err) => {
                console.error('error loading video file at ', this.path, err);
                reject(err);
            });
        });
    }
    /**
     * @return time in milliseconds
     */
    getEntry(entry, log = false) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const command = `ffprobe -v error -show_entries ${entry} -of default=noprint_wrappers=1:nokey=1 "${this.path}"`;
                const ls = child_process_1.spawn(command, [], { shell: true });
                ls.stdout.on('data', data => {
                    if (log)
                        console.log(`stdout: ${data}`);
                    resolve(data);
                });
                ls.stderr.on('data', data => {
                    if (log)
                        console.log(`stderr: ${data}`);
                    reject(data);
                });
                ls.on('error', (error) => {
                    if (log)
                        console.log(`error: ${error.message}`);
                    reject(error);
                });
                ls.on('close', code => {
                    if (log)
                        console.log(`child process exited with code ${code}`);
                });
            });
        });
    }
    setId(id) {
        this.id = id;
    }
}
exports.default = Media;
//# sourceMappingURL=Media.js.map