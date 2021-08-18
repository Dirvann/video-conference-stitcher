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
    constructor(users = [], outputVideo, layout, encOpt, watermark) {
        this.sequenceSteps = [];
        this.mediaList = [];
        this.users = users;
        users.forEach(user => {
            this.mediaList.push(...user.media);
        });
        const defaultEncodingOptions = {
            size: { w: 1280, h: 720 },
            crf: 22,
            showTimeStamp: false,
            gmtTimeOffset: 0
        };
        if (encOpt && encOpt.crf && encOpt.bitrate)
            throw new Error('cannot use bitrate and crf simultaneously');
        const encoding = {
            size: encOpt ? encOpt.size : defaultEncodingOptions.size,
            loglevel: encOpt === null || encOpt === void 0 ? void 0 : encOpt.loglevel,
            showTimeStamp: (encOpt === null || encOpt === void 0 ? void 0 : encOpt.showTimeStamp) ? encOpt.showTimeStamp : defaultEncodingOptions.showTimeStamp,
            // throw error if show timestamp is trua and this is empty
            timeStampStartTime: encOpt === null || encOpt === void 0 ? void 0 : encOpt.timeStampStartTime,
            gmtTimeOffset: (encOpt === null || encOpt === void 0 ? void 0 : encOpt.gmtTimeOffset) ? encOpt.gmtTimeOffset : defaultEncodingOptions.gmtTimeOffset
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
        this.watermark = watermark;
        let minTime = -1;
        let maxTime = -1;
        this.mediaList.forEach(media => {
            if (media.isBackground)
                return;
            if (media.startTime < minTime || minTime === -1)
                minTime = media.startTime;
            if (media.duration + media.startTime > maxTime || maxTime === -1)
                maxTime = media.startTime + media.duration;
        });
        this.duration = maxTime - minTime;
        if (!this.encodingOptions.timeStampStartTime) {
            this.encodingOptions.timeStampStartTime = Math.round(minTime / 1000) + (!!this.encodingOptions.gmtTimeOffset ? this.encodingOptions.gmtTimeOffset * 60 * 60 : 0);
        }
    }
    addVideo(video) {
        this.mediaList.push(video);
    }
    getTimezoneString(timezoneOffset) {
        switch (timezoneOffset) {
            case -5: {
                return 'CDT';
            }
            case -6: {
                return 'CST';
            }
            case -4: {
                return 'EDT';
            }
            case -8: {
                return 'PST';
            }
            case -7: {
                return 'PDT';
            }
            default: {
                return `UTC ${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset}`;
            }
        }
    }
    encode() {
        console.log('start encoding');
        return this.generateCommand().then(([filter, command]) => {
            return CommandExecutor_1.default.pipeExec(filter, command, true);
        });
    }
    getNoVideoBackgrounds(currentMedia) {
        const userIds = this.users.map(user => user.id);
        currentMedia.forEach(media => {
            var _a;
            const index = userIds.indexOf(((_a = media.user) === null || _a === void 0 ? void 0 : _a.id) || -1);
            if (index > -1 && media.hasVideo)
                userIds.splice(index, 1);
        });
        const backgroundMedia = [];
        userIds.forEach(userId => {
            const med = this.mediaList.find(media => { var _a; return media.isBackground && userId === ((_a = media.user) === null || _a === void 0 ? void 0 : _a.id); });
            if (med)
                backgroundMedia.push(med);
        });
        return backgroundMedia;
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
                if (vid.isBackground)
                    return;
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
            // TODO if only 1 user, put background object for other user, if no user, put 2 backgrounds
            let prevTime = -1;
            const currentVideos = [];
            this.sequenceSteps = [];
            while (queue.length > 0) {
                // @ts-ignore
                const point = queue.pop();
                if ((queue.length === 0 || point.time !== prevTime) && prevTime !== -1 && currentVideos.length >= 0) {
                    const backgrounds = this.getNoVideoBackgrounds(currentVideos);
                    let list = [...backgrounds, ...currentVideos];
                    // Sorting video by user id to stay on same side
                    // @ts-ignore
                    list = list.sort((a, b) => { var _a, _b, _c, _d; return ((_a = a.user) === null || _a === void 0 ? void 0 : _a.id) < ((_b = b.user) === null || _b === void 0 ? void 0 : _b.id) ? -1 : (((_c = a.user) === null || _c === void 0 ? void 0 : _c.id) === ((_d = b.user) === null || _d === void 0 ? void 0 : _d.id) ? 0 : 1); });
                    const step = new SequenceStep_1.default(`Seq${this.sequenceSteps.length}`, list, prevTime, point.time, this.encodingOptions.size, this.layout, !!this.encodingOptions.showTimeStamp);
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
            command.push(`-fflags +igndts `);
            // command.push(`-vsync 1 -async 1 `)
            command.push(this.mediaList.map(video => `-i "${video.path}"`).join(' ') + ' ');
            if (this.watermark) {
                command.push(`-i ${this.watermark.path} `);
            }
            command.push(`-filter_complex_script `);
            command.push('pipe:0 ');
            const quality = this.encodingOptions.crf ? `-crf ${this.encodingOptions.crf}` : `-b:v ${this.encodingOptions.bitrate}`;
            command.push(`-c:v libx264 ${quality} -preset fast -map [vid] -map [aud] -y "${this.outputVideo.path}"`);
            const filter = [];
            filter.push(`${this.sequenceSteps.map(step => step.generateFilter()).join('')}`);
            filter.push(`${this.sequenceSteps.map(step => `[${step.id}_out_v][${step.id}_out_a]`).join('')}concat=n=${this.sequenceSteps.length}:v=1:a=1`);
            if (this.encodingOptions.showTimeStamp) {
                filter.push('[vid_no_ts][aud];');
                filter.push(`[vid_no_ts]drawtext=x=5:y=5:fontcolor=white:fontsize=20:box=1:boxcolor=black:line_spacing=3:`);
                // @ts-ignore
                filter.push(`text='%{pts\\:gmtime\\:${this.encodingOptions.timeStampStartTime}\\:%A, %d, %B %Y %I\\\\\\:%M\\\\\\:%S %p} ${this.getTimezoneString(this.encodingOptions.gmtTimeOffset)}'`);
                if (this.watermark) {
                    filter.push('[vid_no_wm];');
                    // scale watermark
                    const size = this.encodingOptions.size;
                    const box = {
                        w: size.w / 2,
                        h: size.h / 2,
                        x: size.w / 2 - (size.w / 5),
                        y: size.h / 2 - (size.h / 5)
                    };
                    // filter.push(`[${this.mediaList.length}:v]trim=0:${this.duration / 1000 },setpts=PTS-STARTPTS,scale=w='if(gt(iw/ih,${box.w}/(${box.h})),${box.w},-2)':h='if(gt(iw/ih,${box.w}/(${box.h})),-2,${box.h})':eval=init[scaled_wm];`)
                    // filter.push(`[vid_no_wm][scaled_wm]overlay=x=${box.x}:y=${box.y}`)
                    filter.push(`[vid_no_wm][${this.mediaList.length}:v]overlay=x=${box.x}:y=${box.y}`);
                }
                filter.push(`[vid]`);
            }
            else {
                filter.push(`[vid][aud]`);
            }
            return Promise.all([filter.join(''), command.join('')]);
        });
    }
}
exports.default = Sequence;
//# sourceMappingURL=Sequence.js.map