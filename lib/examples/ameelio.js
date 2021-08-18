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
const path_1 = __importDefault(require("path"));
const index_1 = require("../index");
const fs_1 = __importDefault(require("fs"));
const { PresenterLayout, GridLayout, MosaicLayout } = index_1.Layouts;
function basicEncode(encode = true) {
    return __awaiter(this, void 0, void 0, function* () {
        // GET LIST OF MEDIA PER USER
        // const videoFolder = path.join(__dirname, '../../videos/ameelio')
        // const videoFolder = path.join(__dirname, '../../videos/corrupt/mkv')
        const videoFolder = path_1.default.join(__dirname, '../../videos/ameelio_error2');
        const filenames = yield fs_1.default.promises.readdir(videoFolder);
        const users = extractUsersFromFilenames(filenames, videoFolder);
        // normalizeTimes(users)
        // CREATE SEQUENCE SETTINGS
        const videoLayout = new MosaicLayout();
        const outputMedia = new index_1.Media(path_1.default.join(__dirname, '..', '..', 'videos', 'rendered', 'basicOutput.mp4'), -1, true, true);
        // WIP
        // const watermark: Media = new Media(path.join(videoFolder,'..','images', 'ameelio_logo.png'),-1,false,false,true)
        const encodingOptions = {
            crf: 40,
            loglevel: 'verbose',
            size: {
                w: 1280,
                h: 720
            },
            showTimeStamp: true,
            // timeStampStartTime:1626088347 // is automatically calculated from media files
            gmtTimeOffset: -5
        };
        // CREATE A SEQUENCE WITH GIVEN SETTINGS
        const sequence = new index_1.Sequence(users, outputMedia, videoLayout, encodingOptions);
        (encode ? sequence.encode() : sequence.generateCommand()).then(comm => {
            console.log(comm);
        });
    });
}
function normalizeTimes(users) {
    let minTime = -1;
    users.forEach(user => {
        user.media.forEach(media => {
            if (media.isBackground)
                return;
            if (media.startTime < minTime || minTime === -1)
                minTime = media.startTime;
        });
    });
    users.forEach(user => {
        user.media.forEach(media => {
            if (media.isBackground)
                return;
            media.startTime = media.startTime - minTime;
        });
    });
}
function extractUsersFromFilenames(filenames, videoFolder) {
    /**
     * 1: call id
     * 2: user id
     * 3: user name
     * 4: start time
     * 5: type (video/audio)
     * 6: extension (default mkv)
     */
    const regex = /(^.*?)(.*?)(.*?)@(.*?)-(.*?)\.(.*?)$/;
    const users = [];
    const map = new Map();
    filenames.map(file => {
        const parsed = file.match(regex);
        return {
            fileName: file,
            callId: parsed[1],
            userId: parsed[2],
            userName: parsed[3],
            startTime: parsed[4],
            type: parsed[5],
            extension: parsed[6]
        };
    }).forEach(p => {
        if (!map.has(p.userId))
            map.set(p.userId, new index_1.User(p.userId, [], p.userName, undefined));
        const media = new index_1.Media(path_1.default.join(videoFolder, p.fileName), p.startTime, p.type === 'video', p.type === 'audio', p.type === 'bg');
        // @ts-ignore
        map.get(p.userId).addMedia(media);
    });
    return Array.from(map.values());
}
basicEncode(true);
//# sourceMappingURL=ameelio.js.map