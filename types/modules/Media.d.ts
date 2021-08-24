import User from './User';
export default class Media {
    readonly path: string;
    readonly hasAudio: boolean;
    readonly hasVideo: boolean;
    startTime: number;
    user: User | null;
    id: number;
    duration: number;
    audioChannels: number;
    initialized: boolean;
    isBackground: boolean;
    /**
     *
     * @param path
     * @param startTime time in milliseconds
     * @param hasVideo
     * @param hasAudio
     * @param isBackground
     */
    constructor(path: string, startTime: number, hasVideo: boolean, hasAudio: boolean, isBackground?: boolean);
    init(): PromiseLike<any>;
    /**
     * @return time in milliseconds
     */
    getEntry(entry: string, log?: boolean): Promise<string>;
    setId(id: number): void;
}
