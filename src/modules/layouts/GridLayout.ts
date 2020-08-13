export default class GridLayout implements VideoLayout {
  getBoxes(n: number, size: Size): VideoBox[] {

    const side:number = n <= 9?3:Math.ceil(Math.sqrt(n))

    const out: VideoBox[] = []

    for(let y=0; y < side; y++) {
      for(let x=0; x < side;x++) {
        out.push({
          w: size.w / side,
          h: size.h / side,
          x: x * (size.w / side),
          y: y * (size.h / side)
        })
      }
    }

    return out
  }
}