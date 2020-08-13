import Video from './Video'
import SequenceStep from './SequenceStep'
import CommandExecutor from './CommandExecutor'
import colors from 'colors'


export default class Sequence {
  public readonly id: string | number
  public videos: Video[]
  public sequenceSteps:SequenceStep[] = []
  public outputVideo: Video
  public layout: VideoLayout
  public encodingOptions: EncodingOptions
  constructor(id:string|number,videos:Video[]=[], outputVideo:Video, layout:VideoLayout, encOpt?: EncodingOptions) {
    this.id = id
    this.videos = videos

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

  addVideo(video:Video):void {
    this.videos.push(video)
  }

  encode():Promise<any> {
    console.log('start encoding')
    return this.generateCommand().then(([filter,command]) => {
      return CommandExecutor.pipeExec(filter,command,true)
    })
  }

  createSequenceSteps():Promise<any> {

    // check videos
    return this.videos
        .reduce(async (p: Promise<void>, vid: Video) => p.then(() => vid.initialized?Promise.resolve():vid.init()), Promise.resolve())
        .catch(err => {
          console.log('error initializing video files', err)
          throw err
        }).then(() => {
      // Order videos
          this.videos
          .sort((a,b) => a.startTime > b.startTime?1:(a.startTime===b.startTime?0:-1))
          .forEach((vid, index) => vid.setId(index))

          const queue:VideoPoint[] = []
          this.videos.forEach(vid => {
            queue.push({
              start_point: true,
              time: vid.startTime,
              video_id: vid.id
            })
            queue.push({
              start_point: false,
              time: vid.startTime + vid.duration,
              video_id: vid.id
            })
          })

          interface VideoPoint {
            start_point: boolean
            time: number
            video_id: number
          }

          queue.sort((a:VideoPoint,b:VideoPoint) => a.time < b.time?1:(a.time===b.time?0:-1))

          console.log(`\n---- sort queue -----\n`, queue)

      // building sequences

          let prevTime:number = -1
          const currentVideos:Video[] = []
          this.sequenceSteps = []
          while(queue.length > 0) {
        // @ts-ignore
            const point:VideoPoint = queue.pop()
            if((queue.length === 0 || point.time !== prevTime) && prevTime !== -1 && currentVideos.length >= 0) {
              const step:SequenceStep = new SequenceStep(`Seq${this.sequenceSteps.length}`,[...currentVideos],prevTime, point.time,this.encodingOptions.size, this.layout)
              this.sequenceSteps.push(step)
            }
            if(point.start_point) {
              currentVideos.push(this.videos[point.video_id])
            } else {
              const index:number = currentVideos.findIndex(vid=> vid.id===point.video_id)
              currentVideos.splice(index,1)
            }
            prevTime = point.time
          }
          console.log('\n---- Videos ----')
          this.videos.forEach(vid => console.log('id', vid.id, 'start', vid.startTime, 'len', vid.duration, 'achan', vid.audioChannels, vid.path))
          console.log('output:',this.outputVideo.path)
          console.log('\n---- Sequences ----')
          this.sequenceSteps.forEach(step => {
            console.log(step.id, 'v:', '[' + step.videos.map(vid => vid.id.toString()).join(',') + ']', 'start', step.startTime,'end', step.startTime + step.duration, 'len',step.duration)
          })
        })
  }
  
  async generateCommand():Promise<string[]> {
    await this.createSequenceSteps()

    const command:string[] = []

    const logging:string = this.encodingOptions.loglevel?`-v ${this.encodingOptions.loglevel}`:`-v quiet -stats`

    command.push('ffmpeg ${logging} ')
    command.push(this.videos.map(video => `-i "${video.path}"`).join(' ') + ' ')
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