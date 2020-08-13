export default class MosaicLayout implements VideoLayout {
  getBoxes(n: number, size: Size): VideoBox[] {

    const list: number[] = [1]
    let ind = 1
    while (ind < n) {
      for (let i = 0; i < list.length; i++) {

        if (i < list.length - 1 && list[i] + 1 === list[i + 1]) {
          list[i]++
          break
        }

        if (list[i] - 1 === list.length && i === list.length - 1) {
          list.push(1)
          break
        }

        if (i === list.length - 1) {
          list[i]++
          break
        }
      }
      ind++
    }

    const out: VideoBox[] = []

    list.forEach((wSplit, yInd) => {
      for (let xInd = 0; xInd < wSplit; xInd++) {
        out.push({
          w: size.w / wSplit,
          h: size.h / list.length,
          x: xInd * (size.w / wSplit),
          y: yInd * (size.h / list.length)
        })
      }
    })

    return out
  }
}