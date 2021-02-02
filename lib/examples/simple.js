"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const index_1 = require("../index");
const { PresenterLayout, GridLayout, MosaicLayout } = index_1.Layouts;
function basicEncode(encode = true) {
    // GET LIST OF MEDIA PER USER
    const videoFolder = path_1.default.join(__dirname, '../../videos');
    const user1Media = [
        new index_1.Media(path_1.default.join(videoFolder, 'vid1.mp4'), 0, true, true),
        new index_1.Media(path_1.default.join(videoFolder, 'vid2.mp4'), 1000, true, true),
        new index_1.Media(path_1.default.join(videoFolder, 'vid3.mp4'), 2000, true, true),
        new index_1.Media(path_1.default.join(videoFolder, 'vid1.mp4'), 2000, true, true),
        new index_1.Media(path_1.default.join(videoFolder, 'vid2.mp4'), 3000, true, true)
    ];
    const user2Media = [
        new index_1.Media(path_1.default.join(videoFolder, 'vid3.mp4'), 3500, true, true),
        new index_1.Media(path_1.default.join(videoFolder, 'vid1.mp4'), 7000, true, true),
        new index_1.Media(path_1.default.join(videoFolder, 'vid2.mp4'), 6000, true, true),
        new index_1.Media(path_1.default.join(videoFolder, 'vid3.mp4'), 10000, true, true)
    ];
    // CREATE USERS WITH THEIR MEDIA FILES
    const users = [
        new index_1.User('user1', user1Media, 'John'),
        new index_1.User('user2', user2Media, 'Kevin')
    ];
    // CREATE SEQUENCE SETTINGS
    const videoLayout = new PresenterLayout();
    const outputMedia = new index_1.Media(path_1.default.join(videoFolder, 'basicOutput.mp4'), -1, true, true);
    const encodingOptions = {
        crf: 20,
        loglevel: 'verbose',
        size: {
            w: 1280,
            h: 720
        }
    };
    // CREATE A SEQUENCE WITH GIVEN SETTINGS
    const sequence = new index_1.Sequence(users, outputMedia, videoLayout, encodingOptions);
    // ENCODE THE SEQUENCE
    sequence.encode().then(comm => {
        console.log(comm);
    });
}
basicEncode();
//# sourceMappingURL=simple.js.map