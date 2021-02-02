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
  constructor(users:User[]=[], outputVideo:Media, layout:VideoLayout, encOpt?: EncodingOptions) {
    this.mediaList = []
    users.forEach(user => {
      this.mediaList.push(...user.media)
    })

    const defaultEncodingOptions:EncodingOptions = {
      size:{w:1280,h:720},
      crf:22
    }
    if(encOpt && encOpt.crf && encOpt.bitrate) throw new Error('cannot use bitrate and crf simultaneously')
    const encoding:EncodingOptions = {
      size: encOpt?encOpt.size:defaultEncodingOptions.size,
      loglevel: encOpt?.loglevel
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
  }

  addVideo(video:Media):void {
    this.mediaList.push(video)
  }

  encode():Promise<any> {
    console.log('start encoding')
    return this.generateCommand().then(([filter,command]) => {
      return CommandExecutor.pipeExec(filter,command,true)
    })
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

          let prevTime:number = -1
          const currentVideos:Media[] = []
          this.sequenceSteps = []
          while(queue.length > 0) {
        // @ts-ignore
            const point:MediaPoint = queue.pop()
            if((queue.length === 0 || point.time !== prevTime) && prevTime !== -1 && currentVideos.length >= 0) {
              const step:SequenceStep = new SequenceStep(`Seq${this.sequenceSteps.length}`,[...currentVideos],prevTime, point.time,this.encodingOptions.size, this.layout)
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
    command.push(this.mediaList.map(video => `-i "${video.path}"`).join(' ') + ' ')
    command.push(`-filter_complex_script `)
    command.push('pipe:0 ')
    const quality:string = this.encodingOptions.crf?`-crf ${this.encodingOptions.crf}`:`-b:v ${this.encodingOptions.bitrate}`
    command.push(`-c:v libx264 ${quality} -preset fast -map [vid] -map [aud] -y "${this.outputVideo.path}"`)

    const filter:string[] = []
    filter.push(`${this.sequenceSteps.map(step => step.generateFilter()).join('')}`)
    filter.push(`${this.sequenceSteps.map(step => `[${step.id}_out_v][${step.id}_out_a]`).join('')}concat=n=${this.sequenceSteps.length}:v=1:a=1[vid][aud]`)

    return Promise.all([filter.join(''),command.join('')])
  }
}