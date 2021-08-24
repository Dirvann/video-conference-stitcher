import {Size, VideoBox, VideoLayout} from '../../types';

export default class PresenterLayout implements VideoLayout{
  getBoxes(n: number, size: Size): VideoBox[] {
    if(n === 1) {
      return [{
        w:size.w,
        h:size.h,
        x:0,
        y:0
      }]
    }
    const out: VideoBox[] = []

    out.push({
      w:size.w,
      h:size.h/2,
      x:0,
      y:0
    })

    const side:number = n-1<= 4?2:Math.ceil(Math.sqrt(n-1))



    for(let y=0; y < side; y++) {
      for(let x=0; x < side;x++) {
        out.push({
          w: size.w / side,
          h: size.h / side/2,
          x: x * (size.w / side),
          y: y * (size.h / side/2) + size.h/2
        })
      }
    }

    return out
      
  }

}