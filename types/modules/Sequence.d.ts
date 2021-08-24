import Media from './Media';
import SequenceStep from './SequenceStep';
import User from './User';
import { EncodingOptions, VideoLayout } from '../types';
export default class Sequence {
    mediaList: Media[];
    sequenceSteps: SequenceStep[];
    outputVideo: Media;
    layout: VideoLayout;
    encodingOptions: EncodingOptions;
    users: User[];
    watermark: Media | undefined;
    duration: number;
    constructor(users: User[] | undefined, outputVideo: Media, layout: VideoLayout, encOpt?: EncodingOptions, watermark?: Media | undefined);
    addVideo(video: Media): void;
    getTimezoneString(timezoneOffset: number): string;
    encode(): Promise<any>;
    private getNoVideoBackgrounds;
    private createSequenceSteps;
    generateCommand(): Promise<string[]>;
}
