import  {spawn} from 'child_process'
import User from './User'

export default class Media {
  public readonly path: string
  public readonly hasAudio: boolean
  public readonly hasVideo: boolean
  public readonly startTime: number
  public user: User|null = null
  public id: number = -1
  public duration:number = -1
  public audioChannels: number = -1
  public initialized:boolean = false

  /**
   *
   * @param path
   * @param startTime time in milliseconds
   * @param hasVideo
   * @param hasAudio
   */
  constructor(path: string, startTime:number, hasVideo:boolean, hasAudio:boolean) {
    this.path = path
    if(!(hasAudio || hasVideo)) throw new Error('media must contain audio or video')
    this.hasAudio = hasAudio
    this.hasVideo = hasVideo
    this.startTime = startTime
  }

  init():PromiseLike<any> {

    // TODO not looking for stream channels if doesn't contain audio.
    // Would it work with just audio files?
    return new Promise((resolve, reject)  => {
      Promise.all([this.getEntry('format=duration'), this.hasAudio?this.getEntry('stream=channels'):'-1'])
          .then(([duration ,channels]) => {
            this.duration = Math.round(parseFloat(duration)*1000)
            this.audioChannels = parseInt(channels, 10)
            this.initialized = true
            resolve()
          })
          .catch((err: any) => {
            console.error('error loading video file', err)
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
        resolve(data)
      })

      ls.stderr.on('data', data => {
        if(log)console.log(`stderr: ${data}`)
        reject(data)
      })

      ls.on('error', (error) => {
        if(log)console.log(`error: ${error.message}`)
        reject(error)
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