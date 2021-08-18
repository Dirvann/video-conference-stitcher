import path from 'path'
import {User, Layouts, Sequence, Media} from '../index'
import fs from 'fs'
const {PresenterLayout, GridLayout, MosaicLayout} = Layouts

async function basicEncode(encode:boolean=true) {
  // GET LIST OF MEDIA PER USER
  // const videoFolder = path.join(__dirname, '../../videos/ameelio')
  // const videoFolder = path.join(__dirname, '../../videos/corrupt/mkv')
  const videoFolder = path.join(__dirname, '../../videos/ameelio_error2')
  const filenames:string[] = await fs.promises.readdir(videoFolder)
  const users:User[] = extractUsersFromFilenames(filenames,videoFolder)

  // normalizeTimes(users)
  // CREATE SEQUENCE SETTINGS
  const videoLayout:VideoLayout = new MosaicLayout()
  const outputMedia: Media = new Media(path.join(__dirname,'..','..','videos','rendered', 'basicOutput.mp4'), -1, true, true)
  // WIP
  // const watermark: Media = new Media(path.join(videoFolder,'..','images', 'ameelio_logo.png'),-1,false,false,true)
  const encodingOptions: EncodingOptions = {
    crf: 40,
    loglevel: 'verbose',
    size:{
      w: 1280,
      h: 720
    },
    showTimeStamp:true,
   // timeStampStartTime:1626088347 // is automatically calculated from media files
    gmtTimeOffset: -5
  }

  // CREATE A SEQUENCE WITH GIVEN SETTINGS
  const sequence: Sequence = new Sequence(users,outputMedia, videoLayout, encodingOptions)

  // ENCODE THE SEQUENCE
  ;(encode?sequence.encode():sequence.generateCommand()).then(comm => {
    console.log(comm)
  })

}

function normalizeTimes(users:User[]):void {
  let minTime = -1
  users.forEach(user => {
    user.media.forEach(media => {
      if(media.isBackground)return
      if(media.startTime < minTime || minTime === -1) minTime = media.startTime
    })
  })

  users.forEach(user => {
    user.media.forEach(media => {
      if(media.isBackground)return
      media.startTime = media.startTime - minTime
    })
  })
}

function extractUsersFromFilenames(filenames:string[], videoFolder:string):User[] {
  /**
   * 1: call id
   * 2: user id
   * 3: user name
   * 4: start time
   * 5: type (video/audio)
   * 6: extension (default mkv)
   */
  const regex:RegExp = /(^.*?)(.*?)(.*?)@(.*?)-(.*?)\.(.*?)$/

  const users:User[] = []
  const map:Map<string,User> = new Map()

  filenames.map(file => {
    const parsed:any = file.match(regex)
    return {
      fileName: file,
      callId: parsed[1],
      userId: parsed[2],
      userName: parsed[3],
      startTime: parsed[4],
      type: parsed[5],
      extension:parsed[6]
    }
  }).forEach(p => {  // create the Users
    if(!map.has(p.userId)) map.set(p.userId,new User(p.userId,[],p.userName,undefined))

    const media:Media = new Media(path.join(videoFolder,p.fileName),p.startTime,p.type==='video',p.type==='audio', p.type === 'bg')
    // @ts-ignore
    map.get(p.userId).addMedia(media)

  })
  return Array.from(map.values())
}


basicEncode(true)

