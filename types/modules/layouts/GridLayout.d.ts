import { Size, VideoBox, VideoLayout } from '../../types';
export default class GridLayout implements VideoLayout {
    getBoxes(n: number, size: Size): VideoBox[];
}
