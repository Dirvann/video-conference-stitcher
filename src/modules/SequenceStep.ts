import Video from './Video'
import {start} from 'repl'

export default class SequenceStep {
  public readonly id: string
  public readonly videos: Video[]
  public readonly startTime: number
  public readonly duration: number
  public readonly size: Size
  private readonly layout: VideoLayout

  constructor(id: string, videos: Video[], startTime: number, endTime: number,size:Size, layout:VideoLayout) {
    this.id = id
    this.videos = videos
    this.startTime = startTime
    this.duration = endTime - startTime
    this.size = size
    this.layout = layout
    if(videos.length === 0) throw new Error('At least one video must be added to the sequence')
  }

  generateFilter():string {
    // TODO I assume videos are sorted by their id small to big
    const boxes:VideoBox[] = this.layout.getBoxes(this.videos.length, this.size)
    // if(this.getDuration() < 30) return `nullsrc=s=${this.size.w}x${this.size.h}:d=${this.getDuration()/1000}[${this.id}_out_v];anullsrc,atrim=0:${this.getDuration()/1000}[${this.id}_out_a];`

    const out:string[] = []
    out.push(`color=s=${this.size.w}x${this.size.h},trim=0:${this.duration / 1000 }[${this.id}_bg];`)

      // --------------- TRIM/SCALE VIDEOS ----------------------- //
    this.videos.forEach((vid, ind) => {
      const box = boxes[ind]
        // Trim video
      out.push(`[${vid.id}:v]trim=${(this.startTime - vid.startTime) / 1000}:${(this.duration + this.startTime - vid.startTime) / 1000 },setpts=PTS-STARTPTS,`)
        // scale fit in box
      out.push(`scale=w='if(gt(iw/ih,${box.w}/(${box.h})),${box.w},-2)':h='if(gt(iw/ih,${box.w}/(${box.h})),-2,${box.h})':eval=init[${this.id}_${vid.id}_v];`)
    })

      // ---------------- OVERLAY VIDEOS ----------------------- //
    let prevVideoId: number = -1
    this.videos.forEach((vid,ind) => {
      const box = boxes[ind]
      let keyOut:string
        // set as output of sequence step if last video in list
      if(ind+1 === this.videos.length) {
        keyOut = `${this.id}_out_v`
      } else {
        keyOut = `${this.id}_overlay_${vid.id}`
      }
        // set input background if first video and link other videos to their previous
      let keyIn:string
      if(prevVideoId === -1) {
        keyIn = `${this.id}_bg`
      } else {
        keyIn = `${this.id}_overlay_${prevVideoId}`
      }
      out.push(`[${keyIn}][${this.id}_${vid.id}_v]overlay=x='(${box.w}-w)/2+${box.x}':y='(${box.h}-h)/2+${box.y}':eval=init${prevVideoId === -1?':shortest=1':''}[${keyOut}];`)

      prevVideoId = vid.id
    })

      // -----------   TRIM AUDIO  ---------------- //
    this.videos.forEach(vid => {
      out.push(`[${vid.id}:a]atrim=${(this.startTime - vid.startTime) / 1000}:${(this.duration + this.startTime - vid.startTime) / 1000 },asetpts=PTS-STARTPTS[${this.id}_${vid.id}_a];`)
    })

      // -----------  MIX AUDIO ------------ //

    const inputList = this.videos.map(vid => `[${this.id}_${vid.id}_a]`).join('')


    let c0:string = ''
    let c1:string = ''
    let currentIndex:number = 0
    this.videos.forEach((vid,ind) => {
      const plus:string = ind===this.videos.length -1?'':'+'
      if(vid.audioChannels === 6) {
        c0 += `0.4*c${currentIndex}+0.6*c${currentIndex+2}${plus}`
        c1 += `0.4*c${currentIndex+1}+0.6*c${currentIndex+2}${plus}`
      } else {
        c0 += `c${currentIndex}${plus}`
        c1 += `c${currentIndex+1}${plus}`
      }
      currentIndex += vid.audioChannels
    })

    out.push(`${inputList}amerge=inputs=${this.videos.length},pan='stereo|c0<${c0}|c1<${c1}'[${this.id}_out_a];`)


    return out.join('')
  }

}
