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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SequenceStep_1 = __importDefault(require("./SequenceStep"));
const CommandExecutor_1 = __importDefault(require("./CommandExecutor"));
class Sequence {
    constructor(users = [], outputVideo, layout, encOpt) {
        this.sequenceSteps = [];
        this.mediaList = [];
        users.forEach(user => {
            this.mediaList.push(...user.media);
        });
        const defaultEncodingOptions = {
            size: { w: 1280, h: 720 },
            crf: 22
        };
        if (encOpt && encOpt.crf && encOpt.bitrate)
            throw new Error('cannot use bitrate and crf simultaneously');
        const encoding = {
            size: encOpt ? encOpt.size : defaultEncodingOptions.size,
            loglevel: encOpt === null || encOpt === void 0 ? void 0 : encOpt.loglevel
        };
        if (!(encOpt === null || encOpt === void 0 ? void 0 : encOpt.crf) && !(encOpt === null || encOpt === void 0 ? void 0 : encOpt.bitrate)) {
            encoding.crf = defaultEncodingOptions.crf;
        }
        else {
            encoding.crf = encOpt === null || encOpt === void 0 ? void 0 : encOpt.crf;
            encoding.bitrate = encOpt === null || encOpt === void 0 ? void 0 : encOpt.bitrate;
        }
        this.encodingOptions = encoding;
        this.outputVideo = outputVideo;
        this.layout = layout;
    }
    addVideo(video) {
        this.mediaList.push(video);
    }
    encode() {
        console.log('start encoding');
        return this.generateCommand().then(([filter, command]) => {
            return CommandExecutor_1.default.pipeExec(filter, command, true);
        });
    }
    createSequenceSteps() {
        // check videos
        return this.mediaList
            .reduce((p, med) => __awaiter(this, void 0, void 0, function* () { return p.then(() => med.initialized ? Promise.resolve() : med.init()); }), Promise.resolve())
            .catch(err => {
            console.log('error initializing video files', err);
            throw err;
        }).then(() => {
            // Order videos
            this.mediaList
                .sort((a, b) => a.startTime > b.startTime ? 1 : (a.startTime === b.startTime ? 0 : -1))
                .forEach((vid, index) => vid.setId(index));
            const queue = [];
            this.mediaList.forEach(vid => {
                queue.push({
                    start_point: true,
                    time: vid.startTime,
                    media_id: vid.id
                });
                queue.push({
                    start_point: false,
                    time: vid.startTime + vid.duration,
                    media_id: vid.id
                });
            });
            queue.sort((a, b) => a.time < b.time ? 1 : (a.time === b.time ? 0 : -1));
            console.log(`\n---- sort queue -----\n`, queue);
            // building sequences
            let prevTime = -1;
            const currentVideos = [];
            this.sequenceSteps = [];
            while (queue.length > 0) {
                // @ts-ignore
                const point = queue.pop();
                if ((queue.length === 0 || point.time !== prevTime) && prevTime !== -1 && currentVideos.length >= 0) {
                    const step = new SequenceStep_1.default(`Seq${this.sequenceSteps.length}`, [...currentVideos], prevTime, point.time, this.encodingOptions.size, this.layout);
                    this.sequenceSteps.push(step);
                }
                if (point.start_point) {
                    currentVideos.push(this.mediaList[point.media_id]);
                }
                else {
                    const index = currentVideos.findIndex(vid => vid.id === point.media_id);
                    currentVideos.splice(index, 1);
                }
                prevTime = point.time;
            }
            console.log('\n---- Videos ----');
            this.mediaList.forEach(vid => console.log('id', vid.id, 'start', vid.startTime, 'len', vid.duration, 'achan', vid.audioChannels, vid.path));
            console.log('output:', this.outputVideo.path);
            console.log('\n---- Sequences ----');
            this.sequenceSteps.forEach(step => {
                console.log(step.id, 'v:', '[' + step.mediaList.map(vid => vid.id.toString()).join(',') + ']', 'start', step.startTime, 'end', step.startTime + step.duration, 'len', step.duration);
            });
        });
    }
    generateCommand() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.createSequenceSteps();
            const command = [];
            const logging = this.encodingOptions.loglevel ? `-v ${this.encodingOptions.loglevel}` : `-v quiet -stats`;
            command.push(`ffmpeg ${logging} `);
            command.push(this.mediaList.map(video => `-i "${video.path}"`).join(' ') + ' ');
            command.push(`-filter_complex_script `);
            command.push('pipe:0 ');
            const quality = this.encodingOptions.crf ? `-crf ${this.encodingOptions.crf}` : `-b:v ${this.encodingOptions.bitrate}`;
            command.push(`-c:v libx264 ${quality} -preset fast -map [vid] -map [aud] -y "${this.outputVideo.path}"`);
            const filter = [];
            filter.push(`${this.sequenceSteps.map(step => step.generateFilter()).join('')}`);
            filter.push(`${this.sequenceSteps.map(step => `[${step.id}_out_v][${step.id}_out_a]`).join('')}concat=n=${this.sequenceSteps.length}:v=1:a=1[vid][aud]`);
            return Promise.all([filter.join(''), command.join('')]);
        });
    }
}
exports.default = Sequence;
//# sourceMappingURL=Sequence.js.map