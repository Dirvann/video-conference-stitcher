import Media from './Media'
import SequenceStep from './SequenceStep'
import CommandExecutor from './CommandExecutor'
import User from './User'


export default class Sequence {
  public mediaList: Media[]
  public sequenceSteps:SequenceStep[] = []
  public outputVideo: Media
  public layout: VideoLayout
  public encodingOptions: EncodingOptions
  public users: User[]
  public watermark: Media|undefined
  public duration:number
  constructor(users:User[]=[], outputVideo:Media, layout:VideoLayout, encOpt?: EncodingOptions, watermark?:Media|undefined) {
    this.mediaList = []
    this.users = users
    users.forEach(user => {
      this.mediaList.push(...user.media)
    })

    const defaultEncodingOptions:EncodingOptions = {
      size:{w:1280,h:720},
      crf:22,
      showTimeStamp: false,
      gmtTimeOffset: 0
    }
    if(encOpt && encOpt.crf && encOpt.bitrate) throw new Error('cannot use bitrate and crf simultaneously')
    const encoding:EncodingOptions = {
      size: encOpt?encOpt.size:defaultEncodingOptions.size,
      loglevel: encOpt?.loglevel,
      showTimeStamp:encOpt?.showTimeStamp?encOpt.showTimeStamp:defaultEncodingOptions.showTimeStamp,
      // throw error if show timestamp is trua and this is empty
      timeStampStartTime: encOpt?.timeStampStartTime,
      gmtTimeOffset: encOpt?.gmtTimeOffset?encOpt.gmtTimeOffset:defaultEncodingOptions.gmtTimeOffset
    }
    if(!encOpt?.crf && !encOpt?.bitrate) {
      encoding.crf = defaultEncodingOptions.crf
    } else {
      encoding.crf = encOpt?.crf
      encoding.bitrate = encOpt?.bitrate
    }

    this.encodingOptions = encoding

    this.outputVideo = outputVideo
    this.layout = layout
    this.watermark = watermark



    let minTime:number = -1
    let maxTime:number = -1

    this.mediaList.forEach(media => {
      if(media.isBackground)return
      if(media.startTime < minTime || minTime === -1) minTime = media.startTime
      if(media.duration + media.startTime > maxTime || maxTime === -1) maxTime = media.startTime + media.duration
    })

    this.duration = maxTime - minTime

    if(!this.encodingOptions.timeStampStartTime) {
      this.encodingOptions.timeStampStartTime = Math.round(minTime/1000) + (!!this.encodingOptions.gmtTimeOffset?this.encodingOptions.gmtTimeOffset*60*60:0)
    }


  }

  addVideo(video:Media):void {
    this.mediaList.push(video)
  }

  getTimezoneString(timezoneOffset:number):string {
    switch(timezoneOffset){
    case -5: {
      return 'CDT'
    }
    case -6: {
      return 'CST'
    }
    case -4: {
      return 'EDT'
    }
    case -8: {
      return 'PST'
    }
    case -7: {
      return 'PDT'
    }
    default: {
      return `UTC ${timezoneOffset>=0?'+':''}${timezoneOffset}`
    }
    }
  }
  

  encode():Promise<any> {
    console.log('start encoding')
    return this.generateCommand().then(([filter,command]) => {
      return CommandExecutor.pipeExec(filter,command,true)
    })
  }

  private getNoVideoBackgrounds(currentMedia:Media[]):Media[] {
    const userIds:(string|number)[] = this.users.map(user => user.id)
    currentMedia.forEach(media => {
      const index = userIds.indexOf(media.user?.id || -1)
      if(index > -1 && media.hasVideo)userIds.splice(index,1)
    })

    const backgroundMedia:Media[] = []

    userIds.forEach(userId => {
      const med:Media|undefined = this.mediaList.find(media => media.isBackground && userId === media.user?.id)
      if(med) backgroundMedia.push(med)
    })

    return backgroundMedia
  }

  private createSequenceSteps():Promise<any> {

    // check videos
    return this.mediaList
        .reduce(async (p: Promise<void>, med: Media) => p.then(() => med.initialized?Promise.resolve():med.init()), Promise.resolve())
        .catch(err => {
          console.log('error initializing video files', err)
          throw err
        }).then(() => {
      // Order videos
          this.mediaList
          .sort((a,b) => a.startTime > b.startTime?1:(a.startTime===b.startTime?0:-1))
          .forEach((vid, index) => vid.setId(index))

          interface MediaPoint {
            start_point: boolean
            time: number
            media_id: number
          }

          const queue:MediaPoint[] = []
          this.mediaList.forEach(vid => {
            if(vid.isBackground) return
            queue.push({
              start_point: true,
              time: vid.startTime,
              media_id: vid.id
            })
            queue.push({
              start_point: false,
              time: vid.startTime + vid.duration,
              media_id: vid.id
            })
          })

          queue.sort((a:MediaPoint,b:MediaPoint) => a.time < b.time?1:(a.time===b.time?0:-1))

          console.log(`\n---- sort queue -----\n`, queue)

      // building sequences
          // TODO if only 1 user, put background object for other user, if no user, put 2 backgrounds
          let prevTime:number = -1
          const currentVideos:Media[] = []
          this.sequenceSteps = []
          while(queue.length > 0) {
        // @ts-ignore
            const point:MediaPoint = queue.pop()
            if((queue.length === 0 || point.time !== prevTime) && prevTime !== -1 && currentVideos.length >= 0) {

              const backgrounds:Media[]  = this.getNoVideoBackgrounds(currentVideos)
              let list:Media[] = [...backgrounds,...currentVideos]
              // Sorting video by user id to stay on same side
              // @ts-ignore
              list = list.sort((a,b) => a.user?.id < b.user?.id?-1:(a.user?.id === b.user?.id?0:1))
              const step:SequenceStep = new SequenceStep(`Seq${this.sequenceSteps.length}`,list,prevTime, point.time,
                  this.encodingOptions.size, this.layout, !!this.encodingOptions.showTimeStamp)
              this.sequenceSteps.push(step)
            }
            if(point.start_point) {
              currentVideos.push(this.mediaList[point.media_id])
            } else {
              const index:number = currentVideos.findIndex(vid=> vid.id===point.media_id)
              currentVideos.splice(index,1)
            }
            prevTime = point.time
          }
          console.log('\n---- Videos ----')
          this.mediaList.forEach(vid => console.log('id', vid.id, 'start', vid.startTime, 'len', vid.duration, 'achan', vid.audioChannels, vid.path))
          console.log('output:',this.outputVideo.path)
          console.log('\n---- Sequences ----')
          this.sequenceSteps.forEach(step => {
            console.log(step.id, 'v:', '[' + step.mediaList.map(vid => vid.id.toString()).join(',') + ']', 'start', step.startTime,'end', step.startTime + step.duration, 'len',step.duration)
          })
        })
  }
  
  async generateCommand():Promise<string[]> {
    await this.createSequenceSteps()

    const command:string[] = []

    const logging:string = this.encodingOptions.loglevel?`-v ${this.encodingOptions.loglevel}`:`-v quiet -stats`

    command.push(`ffmpeg ${logging} `)
    // command.push(`-vsync 1 -async 1 `)
    command.push(this.mediaList.map(video => `-i "${video.path}"`).join(' ') + ' ')
    if(this.watermark) {
      command.push(`-i ${this.watermark.path} `)
    }
    command.push(`-filter_complex_script `)
    command.push('pipe:0 ')
    const quality:string = this.encodingOptions.crf?`-crf ${this.encodingOptions.crf}`:`-b:v ${this.encodingOptions.bitrate}`
    command.push(`-c:v libx264 ${quality} -preset fast -map [vid] -map [aud] -y "${this.outputVideo.path}"`)

    const filter:string[] = []
    filter.push(`${this.sequenceSteps.map(step => step.generateFilter()).join('')}`)
    filter.push(`${this.sequenceSteps.map(step => `[${step.id}_out_v][${step.id}_out_a]`).join('')}concat=n=${this.sequenceSteps.length}:v=1:a=1`)
    if(this.encodingOptions.showTimeStamp) {
      filter.push('[vid_no_ts][aud];')
      filter.push(`[vid_no_ts]drawtext=x=5:y=5:fontcolor=white:fontsize=20:box=1:boxcolor=black:line_spacing=3:`)
      // @ts-ignore
      filter.push(`text='%{pts\\:gmtime\\:${this.encodingOptions.timeStampStartTime}\\:%A, %d, %B %Y %I\\\\\\:%M\\\\\\:%S %p} ${this.getTimezoneString(this.encodingOptions.gmtTimeOffset)}'`)

      if(this.watermark) {
        filter.push('[vid_no_wm];')
        // scale watermark
        const size:Size = this.encodingOptions.size
        const box:VideoBox = {
          w:size.w/2,
          h:size.h/2,
          x:size.w/2 - (size.w/5),
          y:size.h/2 - (size.h/5)
        }
        // filter.push(`[${this.mediaList.length}:v]trim=0:${this.duration / 1000 },setpts=PTS-STARTPTS,scale=w='if(gt(iw/ih,${box.w}/(${box.h})),${box.w},-2)':h='if(gt(iw/ih,${box.w}/(${box.h})),-2,${box.h})':eval=init[scaled_wm];`)
        // filter.push(`[vid_no_wm][scaled_wm]overlay=x=${box.x}:y=${box.y}`)
        filter.push(`[vid_no_wm][${this.mediaList.length}:v]overlay=x=${box.x}:y=${box.y}`)
      }
      filter.push(`[vid]`)
    } else {
      filter.push(`[vid][aud]`)
    }




    return Promise.all([filter.join(''),command.join('')])
  }
}