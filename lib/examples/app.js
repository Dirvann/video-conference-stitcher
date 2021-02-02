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
const { PresenterLayout, GridLayout, MosaicLayout } = index_1.Layouts;
function basicEncode(encode = true) {
    // GET LIST OF MEDIA PER USER
    const videoFolder = path_1.default.join(__dirname, '../videos');
    const userMedia1 = [
        new index_1.Media(path_1.default.join(videoFolder, 'vid1_v.mp4'), 0, true, false),
        new index_1.Media(path_1.default.join(videoFolder, 'vid1_a.aac'), 5000, false, true)
    ];
    const userMedia2 = [
        new index_1.Media(path_1.default.join(videoFolder, 'vid1.mp4'), 2000, true, true)
    ];
    // CREATE USERS WITH THEIR MEDIA FILES
    const users = [
        new index_1.User('user1', userMedia1, 'KEVIN'),
        new index_1.User('user2', userMedia2, 'JEFF')
    ];
    // CREATE SEQUENCE SETTINGS
    const videoLayout = new PresenterLayout();
    const outputMedia = new index_1.Media(path_1.default.join(__dirname, '../videos', 'basicOutput.mp4'), -1, true, true);
    const encodingOptions = {
        crf: 20,
        loglevel: 'verbose',
        size: {
            w: 1280,
            h: 720
        }
    };
    // CREATE A SEQUENCE WITH GIVEN SETTINGS
    const sequence = new index_1.Sequence(0, users, outputMedia, videoLayout, encodingOptions);
    // ENCODE THE SEQUENCE
    sequence.encode().then(comm => {
        console.log(comm);
    });
}
function command(encode = true) {
    const videoFolder = path_1.default.join(__dirname, '../videos');
    const videos = [
        new index_1.Media(path_1.default.join(videoFolder, 'vid1.mp4'), 0, true, true),
        new index_1.Media(path_1.default.join(videoFolder, 'vid2.mp4'), 5000, true, true),
        new index_1.Media(path_1.default.join(videoFolder, 'vid3.mp4'), 5000, true, true),
        new index_1.Media(path_1.default.join(videoFolder, 'vid3.mp4'), 6000, true, true),
        new index_1.Media(path_1.default.join(videoFolder, 'vid3.mp4'), 5000, true, true),
        new index_1.Media(path_1.default.join(videoFolder, 'vid3.mp4'), 5000, true, true),
        new index_1.Media(path_1.default.join(videoFolder, 'vid4.mp4'), 2000, true, true),
        new index_1.Media(path_1.default.join(videoFolder, 'vid4.mp4'), 4000, true, true),
        new index_1.Media(path_1.default.join(videoFolder, 'vid5.mp4'), 3000, true, true),
        new index_1.Media(path_1.default.join(videoFolder, 'vid5.mp4'), 0, true, true),
        new index_1.Media(path_1.default.join(videoFolder, 'vid-spie-40.mp4'), 2000, true, true),
        // new Video(path.join(videoFolder,'vid-spie-40.mp4'), 8000),
        new index_1.Media(path_1.default.join(videoFolder, 'vid-spie-60.mp4'), 0, true, true)
    ];
    const videoOut = new index_1.Media(path_1.default.join(__dirname, '../videos', 'vid-aud2.mp4'), -1, true, true);
    const encodingOptions = {
        crf: 20,
        loglevel: 'verbose',
        size: {
            w: 1280,
            h: 720
        }
    };
    const layout = new PresenterLayout();
    const userMedia1 = [
        new index_1.Media(path_1.default.join(videoFolder, 'vid1_v.mp4'), 0, true, false),
        new index_1.Media(path_1.default.join(videoFolder, 'vid1_a.aac'), 5000, false, true)
    ];
    const userMedia2 = [
        new index_1.Media(path_1.default.join(videoFolder, 'vid1.mp4'), 2000, true, true)
    ];
    const users = [
        new index_1.User('user1', userMedia1, 'KEVIN'),
        new index_1.User('user2', userMedia2, 'JEFF')
    ];
    Promise.resolve().then(() => __awaiter(this, void 0, void 0, function* () {
        const sequence = new index_1.Sequence(0, users, videoOut, layout, encodingOptions);
        (encode ? sequence.encode() : sequence.generateCommand()).then((comm) => {
            // tslint:disable-next-line:no-unused-expression
            if (comm) {
                console.log('\n------ START COMMAND -----\n' + comm[1].replace('-filter_complex_script', '-filter_complex')
                    .replace('pipe:0', comm[0])
                    .replace(/;/g, ';\\\n')
                    .replace(/color/g, '\ncolor')
                    .replace(/-i/g, '\\\n-i') + '\n---- END COMMAND -----\n');
            }
        });
    })).catch(err => {
        console.error('Sequence error:');
        console.error(err);
    });
}
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', function (text) {
    text = text.trim();
    if (text.split(' ')[0] === 'e') {
        try {
            // tslint:disable-next-line:no-eval
            eval(text.slice(2, text.length));
        }
        catch (e) {
            console.log(e);
        }
    }
    if (text.split(' ')[0] === 'c') {
        const comm = 'console.log(' + text.slice(2, text.length) + ')';
        console.log(comm);
        try {
            // tslint:disable-next-line:no-eval
            eval(comm);
        }
        catch (e) {
            console.log(e);
        }
    }
    if (text === 'r') {
        command();
    }
    if (text === 'g') {
        command(false);
    }
    if (text === 'b') {
        basicEncode();
    }
    if (text === 'l') {
        (new MosaicLayout()).getBoxes(10, { w: 400, h: 400 });
    }
    if (text === 'quit') {
        process.exit();
    }
});
//# sourceMappingURL=app.js.map