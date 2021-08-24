import { Size, VideoBox, VideoLayout } from '../../types';
export default class PresenterLayout implements VideoLayout {
    getBoxes(n: number, size: Size): VideoBox[];
}
