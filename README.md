# Video Conference Recorder

Combine separately recorded recordings from a video conference into a single video file.



## Requirements

- ffmpeg
- linux system (windows not supported at this time)

## Installation

Install with npm with the following command:

`npm i --save video-conference-recorder`

## Example

```typescript
const path = require('path')
const fs = require('fs')

// import the classes
const {User, Layouts, Sequence, Media} = require('video-conference-recorder')
const {PresenterLayout, GridLayout, MosaicLayout} = Layouts


// variable for folders to get the videos from
const videoFolder = path.join(__dirname, 'videos')
fs.mkdir(videoFolder)

// creating a lists of media (audio+video / audio / video) for each user
const userMedia1:Media[] = [
  new Media(path.join(videoFolder,'vid1.mp4'), 0, true, true),
]
const userMedia2:Media[] = [
  new Media(path.join(videoFolder,'vid1.mp4'), 2000, true, true)
]

// Create users with their id, name and media files
const users:User[] =[
  new User('user1', userMedia1, 'KEVIN'),
  new User('user2', userMedia2, 'JEFF')
]

// Select a layout to use
const videoLayout:VideoLayout = new PresenterLayout()

// Destination file
const outputMedia: Media = new Media(path.join(__dirname, 'videos', 'basicOutput.mp4'), -1, true, true)

// encoding options
const encodingOptions: EncodingOptions = {
  crf: 20,
  loglevel: 'verbose',
  size:{
    w: 1280,
    h: 720
  }
}

// Create a sequence with given settings
const sequence: Sequence = new Sequence(0, users,outputMedia, videoLayout, encodingOptions)

// Encode the sequence, now the output file with the generated combined video is generated
sequence.encode().then(comm => {
  console.log(comm)
})
```



## Documentation





## TODO

- [x] link user to video audio file

- [x] user with audio, no video, but active speaker -> placeholder

- [ ] implement custom user priority map





