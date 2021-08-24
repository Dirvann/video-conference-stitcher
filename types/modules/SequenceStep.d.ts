import Media from './Media';
import { Size, VideoLayout } from '../types';
export default class SequenceStep {
    readonly id: string;
    readonly mediaList: Media[];
    readonly startTime: number;
    readonly duration: number;
    readonly size: Size;
    private readonly layout;
    private readonly showNameOverVideo;
    private readonly showTimeStamp;
    constructor(id: string, mediaList: Media[], startTime: number, endTime: number, size: Size, layout: VideoLayout, showTimeStamp: boolean);
    generateFilter(): string;
}
