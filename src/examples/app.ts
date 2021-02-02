import path from 'path'
import {User, Layouts, Sequence, Media} from '../index'
const {PresenterLayout, GridLayout, MosaicLayout} = Layouts

function basicEncode(encode:boolean=true) {
  // GET LIST OF MEDIA PER USER
  const videoFolder = path.join(__dirname, '../videos')
  const userMedia1:Media[] = [
    new Media(path.join(videoFolder,'vid1_v.mp4'), 0, true, false),
    new Media(path.join(videoFolder,'vid1_a.aac'), 5000, false, true)
  ]
  const userMedia2:Media[] = [
    new Media(path.join(videoFolder,'vid1.mp4'), 2000, true, true)
  ]

  // CREATE USERS WITH THEIR MEDIA FILES
  const users:User[] =[
    new User('user1', userMedia1, 'KEVIN'),
    new User('user2', userMedia2, 'JEFF')
  ]

  // CREATE SEQUENCE SETTINGS
  const videoLayout:VideoLayout = new PresenterLayout()
  const outputMedia: Media = new Media(path.join(__dirname, '../videos', 'basicOutput.mp4'), -1, true, true)
  const encodingOptions: EncodingOptions = {
    crf: 20,
    loglevel: 'verbose',
    size:{
      w: 1280,
      h: 720
    }
  }

  // CREATE A SEQUENCE WITH GIVEN SETTINGS
  const sequence: Sequence = new Sequence(0, users,outputMedia, videoLayout, encodingOptions)

  // ENCODE THE SEQUENCE
  sequence.encode().then(comm => {
    console.log(comm)
  })

}

function command(encode:boolean=true) {
  const videoFolder = path.join(__dirname, '../videos')
  const videos: Media[] = [
    new Media(path.join(videoFolder, 'vid1.mp4'), 0, true, true),
    new Media(path.join(videoFolder, 'vid2.mp4'), 5000, true, true),
    new Media(path.join(videoFolder, 'vid3.mp4'), 5000, true, true),
    new Media(path.join(videoFolder, 'vid3.mp4'), 6000, true, true),
    new Media(path.join(videoFolder, 'vid3.mp4'), 5000, true, true),
    new Media(path.join(videoFolder, 'vid3.mp4'), 5000, true, true),
    new Media(path.join(videoFolder,'vid4.mp4'), 2000, true, true),
    new Media(path.join(videoFolder,'vid4.mp4'), 4000, true, true),
    new Media(path.join(videoFolder,'vid5.mp4'), 3000, true, true),
    new Media(path.join(videoFolder,'vid5.mp4'), 0, true, true),
    new Media(path.join(videoFolder,'vid-spie-40.mp4'), 2000, true, true),
    // new Video(path.join(videoFolder,'vid-spie-40.mp4'), 8000),
    new Media(path.join(videoFolder,'vid-spie-60.mp4'), 0, true, true)
  ]
  const videoOut: Media = new Media(path.join(__dirname, '../videos', 'vid-aud2.mp4'), -1, true, true)
  const encodingOptions: EncodingOptions = {
    crf: 20,
    loglevel: 'verbose',
    size:{
      w: 1280,
      h: 720
    }
  }
  const layout:VideoLayout = new PresenterLayout()


  const userMedia1:Media[] = [
    new Media(path.join(videoFolder,'vid1_v.mp4'), 0, true, false),
    new Media(path.join(videoFolder,'vid1_a.aac'), 5000, false, true)
  ]

  const userMedia2:Media[] = [
    new Media(path.join(videoFolder,'vid1.mp4'), 2000, true, true)
  ]

  const users:User[] =[
    new User('user1', userMedia1, 'KEVIN'),
    new User('user2', userMedia2, 'JEFF')
  ]

  Promise.resolve().then(async () => {
    const sequence: Sequence = new Sequence(0, users,videoOut, layout, encodingOptions)
    ;(encode?sequence.encode():sequence.generateCommand()).then((comm:string[]) => {
      // tslint:disable-next-line:no-unused-expression
      if(comm) {
        console.log('\n------ START COMMAND -----\n' + comm[1].replace('-filter_complex_script', '-filter_complex')
            .replace('pipe:0', comm[0])
            .replace(/;/g,';\\\n')
            .replace(/color/g,'\ncolor')
            .replace(/-i/g,'\\\n-i')+ '\n---- END COMMAND -----\n')
      }
    })
  }).catch(err => {
    console.error('Sequence error:')
    console.error(err)
  })
}

process.stdin.resume()
process.stdin.setEncoding('utf8')

process.stdin.on('data', function(text:string) {
  text = text.trim()
  if (text.split(' ')[0] === 'e') {
    try {
      // tslint:disable-next-line:no-eval
      eval(text.slice(2, text.length))
    } catch (e) {
      console.log(e)
    }
  }
  if (text.split(' ')[0] === 'c') {
    const comm = 'console.log(' + text.slice(2, text.length) + ')'
    console.log(comm)
    try {
      // tslint:disable-next-line:no-eval
      eval(comm)
    } catch (e) {
      console.log(e)
    }
  }

  if(text === 'r'){
    command()
  }
  if(text === 'g') {
    command(false)
  }
  if(text === 'b') {
    basicEncode()
  }
  if(text === 'l') {
    (new MosaicLayout()).getBoxes(10,{w:400,h:400})
  }

  if (text === 'quit') {
    process.exit()
  }
})