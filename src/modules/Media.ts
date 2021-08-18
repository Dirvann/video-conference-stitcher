import  {spawn} from 'child_process'
import User from './User'

export default class Media {
  public readonly path: string
  public readonly hasAudio: boolean
  public readonly hasVideo: boolean
  public startTime: number
  public user: User|null = null
  public id: number = -1
  public duration:number = -1
  public audioChannels: number = -1
  public initialized:boolean = false
  public isBackground:boolean = false

  /**
   *
   * @param path
   * @param startTime time in milliseconds
   * @param hasVideo
   * @param hasAudio
   * @param isBackground
   */
  constructor(path: string, startTime:number, hasVideo:boolean, hasAudio:boolean, isBackground?:boolean) {
    this.path = path
    if(!(hasAudio || hasVideo || isBackground)) throw new Error('media must contain audio, video or a background image.')

    if(isBackground && (hasAudio || hasVideo)) throw new Error('Media cannot have background combined with audio or video')
    this.hasAudio = hasAudio
    this.hasVideo = hasVideo
    this.startTime = parseInt(String(startTime),10)
    this.isBackground = isBackground || false
    if(this.isBackground) startTime = -1
  }

  init():PromiseLike<any> {

    // TODO not looking for stream channels if doesn't contain audio.
    // Would it work with just audio files?
    return new Promise((resolve, reject)  => {
      Promise.resolve()
          .then(async () => {
            let duration:string
            for(let i = 0; i < 30; i++) {
              duration = this.isBackground ? '-1' : await this.getEntry('format=duration')
              this.duration = duration==='-1'?-1:Math.round(parseFloat(duration)*1000)
              if(!Number.isNaN(this.duration) || this.isBackground) {
                break
              } else {
                console.log(`The duration of Media ${this.path} parsed as NaN, trying again. (attempt ${i+1}/30)`)
                await new Promise(res => setTimeout(res, 1000))
              }
            }
            const channels = this.hasAudio?await this.getEntry('stream=channels'):'-1'
            this.audioChannels = parseInt(channels, 10)
            this.initialized = true
            resolve(true)
          })
          .catch((err: any) => {
            console.error('error loading video file at ',this.path, err)
            reject(err)
          })
    })
  }

  /**
   * @return time in milliseconds
   */
  async getEntry(entry:string, log:boolean=false):Promise<string> {
    return new Promise((resolve, reject) => {
      const command = `ffprobe -v error -show_entries ${entry} -of default=noprint_wrappers=1:nokey=1 "${this.path}"`
      const ls = spawn(command, [], {shell: true})
      ls.stdout.on('data', data => {
        if(log)console.log(`stdout: ${data}`)
        resolve(data.toString())
      })

      ls.stderr.on('data', data => {
        if(log)console.log(`stderr: ${data}`)
        reject(data.toString())
      })

      ls.on('error', (error) => {
        if(log)console.log(`error: ${error.message}`)
        reject(error.toString())
      })

      ls.on('close', code => {
        if(log)console.log(`child process exited with code ${code}`)
      })
    })
  }
  
  setId(id:number):void{
    this.id = id
  }
}