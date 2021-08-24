import path from 'path'
import {User, Layouts, Sequence, Media, EncodingOptions, VideoLayout} from '../index'
const {PresenterLayout, GridLayout, MosaicLayout} = Layouts

function basicEncode(encode:boolean=true) {
  // GET LIST OF MEDIA PER USER
  const videoFolder = path.join(__dirname, '../../videos')

  const user1Media:Media[] = [
    new Media(path.join(videoFolder,'vid1.mp4'), 0, true, true),
    new Media(path.join(videoFolder,'vid2.mp4'), 1000, true, true),
    new Media(path.join(videoFolder,'vid3.mp4'), 2000, true, true),
    new Media(path.join(videoFolder,'vid1.mp4'), 2000, true, true),
    new Media(path.join(videoFolder,'vid2.mp4'), 3000, true, true)
  ]

  const user2Media:Media[]= [
    new Media(path.join(videoFolder,'vid3.mp4'), 3500, true, true),
    new Media(path.join(videoFolder,'vid1.mp4'), 7000, true, true),
    new Media(path.join(videoFolder,'vid2.mp4'), 6000, true, true),
    new Media(path.join(videoFolder,'vid3.mp4'), 10000, true, true)
  ]
  // CREATE USERS WITH THEIR MEDIA FILES
  const users:User[] = [
    new User('user1', user1Media, 'John'),
    new User('user2', user2Media, 'Kevin')
  ]

  // CREATE SEQUENCE SETTINGS
  const videoLayout:VideoLayout = new PresenterLayout()
  const outputMedia: Media = new Media(path.join(videoFolder, 'basicOutput.mp4'), -1, true, true)
  const encodingOptions: EncodingOptions = {
    crf: 20,
    loglevel: 'verbose',
    size:{
      w: 1280,
      h: 720
    }
  }

  // CREATE A SEQUENCE WITH GIVEN SETTINGS
  const sequence: Sequence = new Sequence(users,outputMedia, videoLayout, encodingOptions)

  // ENCODE THE SEQUENCE
  sequence.encode().then(comm => {
    console.log(comm)
  })
}


basicEncode()

