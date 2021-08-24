import Media from './Media';
export default class User {
    id: string | number;
    media: Media[];
    readonly name: string;
    background: string | undefined;
    constructor(id: string | number, media: Media[], name?: string | undefined, background?: string | undefined);
    addMedia(...media: Media[]): void;
}
