"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SequenceStep {
    constructor(id, mediaList, startTime, endTime, size, layout, showTimeStamp) {
        this.id = id;
        this.mediaList = mediaList;
        this.startTime = startTime;
        this.duration = endTime - startTime;
        this.size = size;
        this.layout = layout;
        this.showNameOverVideo = true;
        this.showTimeStamp = showTimeStamp;
        // if(mediaList.length === 0) throw new Error('At least one video must be added to the sequence step')
    }
    generateFilter() {
        // All generated videos. Audio without linked video and video files
        const videoList = this.mediaList.filter(media => media.hasVideo || media.isBackground ||
            (media.hasAudio &&
                !media.hasVideo &&
                !this.mediaList.some(other => { var _a, _b; return (other.hasVideo || other.isBackground) && media.user && ((_a = other.user) === null || _a === void 0 ? void 0 : _a.id) === ((_b = media.user) === null || _b === void 0 ? void 0 : _b.id); })));
        // All background images for the users
        // const backgroundsList = this.mediaList.filter(media => media.isBackground)
        // TODO I assume videos are sorted by their id small to big
        const boxes = this.layout.getBoxes(videoList.length, this.size);
        // if(this.getDuration() < 30) return `nullsrc=s=${this.size.w}x${this.size.h}:d=${this.getDuration()/1000}[${this.id}_out_v];anullsrc,atrim=0:${this.getDuration()/1000}[${this.id}_out_a];`
        // Input a black background as background input, or directly to output if no video
        const out = [];
        if (videoList.length > 0) {
            out.push(`color=s=${this.size.w}x${this.size.h},trim=0:${this.duration / 1000}[${this.id}_bg];`);
        }
        else {
            // TODO add backgrounds over this
            out.push(`color=s=${this.size.w}x${this.size.h},trim=0:${this.duration / 1000}[${this.id}_out_v];`);
        }
        // --------------- TRIM/SCALE VIDEOS ----------------------- //
        let lastBoxIndex = 0;
        videoList.forEach((vid, ind) => {
            var _a, _b, _c;
            const box = boxes[ind];
            lastBoxIndex = ind + 1;
            // Trim video
            // check if is video or find a video of same user as current video (for is no video????) to test
            if (vid.hasVideo || videoList.find(v => { var _a, _b; return ((_a = v.user) === null || _a === void 0 ? void 0 : _a.id) === ((_b = vid.user) === null || _b === void 0 ? void 0 : _b.id) && (v.hasVideo); })) {
                out.push(`[${vid.id}:v]trim=${(this.startTime - vid.startTime) / 1000}:${(this.duration + this.startTime - vid.startTime) / 1000},setpts=PTS-STARTPTS,`);
                // out.push(`drawtext=text='${vid.user?.name}':x=5:y=5:fontcolor=black:fontsize=25,`)
                // if background, make video of the input image file and add name in middle
            }
            else if (vid.isBackground) {
                out.push(`[${vid.id}:v]trim=0:${this.duration / 1000},drawtext=text='${(_a = vid.user) === null || _a === void 0 ? void 0 : _a.name}':x=(w-tw)/2:y=((h-th)/2):fontcolor=black:fontsize=55,`);
                // if audio, create background color with text
            }
            else {
                out.push(`color=s=${this.size.w}x${this.size.h}:c=green@1.0,trim=0:${this.duration / 1000},drawtext=text='${(_b = vid.user) === null || _b === void 0 ? void 0 : _b.name}':x=(w-tw)/2:y=((h-th)/2):fontcolor=black:fontsize=55,`);
            }
            // scale fit in box
            out.push(`scale=w='if(gt(iw/ih,${box.w}/(${box.h})),${box.w},-2)':h='if(gt(iw/ih,${box.w}/(${box.h})),-2,${box.h})':eval=init`);
            if (this.showNameOverVideo)
                out.push(`,drawtext=text='${(_c = vid.user) === null || _c === void 0 ? void 0 : _c.name}':x=5:y=h-th-5:fontcolor=white:fontsize=20:box=1:boxcolor=black:line_spacing=3`);
            out.push(`[${this.id}_${vid.id}_v];`);
        });
        // ---------------- OVERLAY VIDEOS ----------------------- //
        let prevVideoId = -1;
        videoList.forEach((vid, ind) => {
            const box = boxes[ind];
            let keyOut;
            // set as output of sequence step if last video in list
            if (ind + 1 === videoList.length) {
                keyOut = `${this.id}_out_v`;
            }
            else {
                keyOut = `${this.id}_overlay_${vid.id}`;
            }
            // set input background if first video and link other videos to their previous
            let keyIn;
            if (prevVideoId === -1) {
                keyIn = `${this.id}_bg`;
            }
            else {
                keyIn = `${this.id}_overlay_${prevVideoId}`;
            }
            out.push(`[${keyIn}][${this.id}_${vid.id}_v]overlay=x='(${box.w}-w)/2+${box.x}':y='(${box.h}-h)/2+${box.y}':eval=init${prevVideoId === -1 ? ':shortest=1' : ''}[${keyOut}];`);
            prevVideoId = vid.id;
        });
        // -----------   TRIM AUDIO  ---------------- //
        const audioList = this.mediaList.filter(media => media.hasAudio);
        audioList.forEach(vid => {
            out.push(`[${vid.id}:a]atrim=${(this.startTime - vid.startTime) / 1000}:${(this.duration + this.startTime - vid.startTime) / 1000},asetpts=PTS-STARTPTS[${this.id}_${vid.id}_a];`);
        });
        // -----------  MIX AUDIO ------------ //
        const inputList = audioList.map(vid => `[${this.id}_${vid.id}_a]`).join('');
        let c0 = '';
        let c1 = '';
        let currentIndex = 0;
        audioList.forEach((vid, ind) => {
            const plus = ind === audioList.length - 1 ? '' : '+';
            if (vid.audioChannels === 6) {
                c0 += `0.4*c${currentIndex}+0.6*c${currentIndex + 2}${plus}`;
                c1 += `0.4*c${currentIndex + 1}+0.6*c${currentIndex + 2}${plus}`;
            }
            else {
                c0 += `c${currentIndex}${plus}`;
                c1 += `c${currentIndex + 1}${plus}`;
            }
            currentIndex += vid.audioChannels;
        });
        if (audioList.length > 0) {
            out.push(`${inputList}amerge=inputs=${audioList.length},pan='stereo|c0<${c0}|c1<${c1}'[${this.id}_out_a];`);
        }
        else {
            // TODO what sample rate to choose? Maybe need to convert all sample rates of files before concat
            out.push(`anullsrc=r=48000:cl=stereo,atrim=0:${this.duration / 1000},asetpts=PTS-STARTPTS[${this.id}_out_a];`);
        }
        return out.join('');
    }
}
exports.default = SequenceStep;
//# sourceMappingURL=SequenceStep.js.map