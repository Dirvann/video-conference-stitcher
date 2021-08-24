import { Size, VideoBox, VideoLayout } from '../../types';
export default class MosaicLayout implements VideoLayout {
    getBoxes(n: number, size: Size): VideoBox[];
}
