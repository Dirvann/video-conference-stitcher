# Video Conference Stitcher

Combine separately recorded recordings from a video conference into a single video file.

## How it works

This project is intended to combine separately recorded videos from a live video conference into a single recording. All this while having control of how the layout is. The input videos can start any time in the conference and the layout will change dynamically. 

The minimal information needed is:

- start time of the recording (relative to the beginning of the call)
- file of the recording (audio and video may or may not be separate)



## Requirements

- ffmpeg
- linux system (windows not supported at this time)

## Installation

Install with npm with the following command:

`npm install --save video-conference-stitcher`

## Getting started

### Run the example

To run the example run the following command in the main folder:

`npm run example`

### Example script

```typescript
const path = require('path')
const fs = require('fs')

// import the classes
const {User, Layouts, Sequence, Media} = require('video-conference-stitcher')
const {PresenterLayout, GridLayout, MosaicLayout} = Layouts


// variable for folders to get the videos from
const videoFolder = path.join(__dirname, 'videos')
fs.mkdir(videoFolder)

// creating a lists of media (audio+video / audio / video) for each user
const userMedia1:Media[] = [
  new Media(path.join(videoFolder,'vid1.mp4'), 0, true, true),
]
const userMedia2:Media[] = [
  new Media(path.join(videoFolder,'vid2.mp4'), 2000, true, true)
]

// Create users with their id, name and media files
const users:User[] =[
  new User('user1', userMedia1, 'KEVIN'),
  new User('user2', userMedia2, 'JEFF')
]

// Select a layout to use
const videoLayout:VideoLayout = new PresenterLayout()

// Destination file
const outputMedia: Media = new Media(path.join(videoFolder, 'basicOutput.mp4'), -1, true, true)

// encoding options
const encodingOptions = {
  crf: 20,
  loglevel: 'verbose',
  size:{
    w: 1280,
    h: 720
  }
}

// Create a sequence with given settings
const sequence = new Sequence(0, users,outputMedia, videoLayout, encodingOptions)

// Encode the sequence, now the output file with the generated combined video is generated
sequence.encode().then(comm => {
  console.log(comm)
})
```



## Documentation

### Classes

#### Media(path: string, startTime:number, hasVideo:boolean, hasAudio:boolean)

Defines a single video / audio file on the file system. The file can contain audio and video at the same time or separately.

##### Parameters

- **path**: Path to the media file as string.
- **startTime**: Relative time when the media starts in ms. The time is the time elapsed from the start of the video conference (which is 0ms).
- **hasVideo**: If the media file contains a video stream.
- **hasAudio**: If the media file contains an audio stream.

##### Usage

```js
const {Media} = require('video-conference-stitcher')
const mediaObject = new Media('/home/user/vid.mp4', 2000, true, true)
```





#### User(id:string|number,media:Media[], name?:string|undefined) 

A user in the video conference. May have multiple streams.

##### Parameters

- **id**: string / number with the id of the user.
- **media**: List of media objects for the user.
- **name**(optional): Display name of the user.

##### Usage

```js
const {User Media} = require('video-conference-stitcher')

const mediaList = [new Media(...), new Media(...)]
                                          
const user = new User('user123', mediaList, 'Bob')
OR 
const user = new User('user123', mediaList)
```





#### Layouts (GridLayout, PresenterLayout, MosaicLayout)

Objects that can be used for different output layouts or in other words change the arrangement of the separate video streams on the screen.

Available:

- Layouts.GridLayout
- Layouts.PresenterLayout
- Layouts.MosaicLayout

##### Usage

```js
const {Layouts} = require('video-conference-stitcher')
const videoLayout = new Layouts.GridLayout()
const seq = new Sequence(.., ..,.., videoLayout, ..)
```





#### Sequence (users:User[], outputVideo:Media, layout:VideoLayout, encOpt?: EncodingOptions)

##### Parameters

- **users**(Users[]): List of user objects to be encoded.
- **outputVideo**: Media object for the output file.
- **layout**: Layout of the combined videos.
- **encOpt**(optional): Extra options for encoding.

##### Functions

- **encode()**: Encodes the separate files into a single file with the given commands.
- **generateCommand()**: Returns the ffmpeg command that will run as a string.

##### Usage

```js
const {Sequence, User, Layouts} = require('video-conference-stitcher')

const encodingOptions = {...}
const videoLayout = new GridLayout() // other layouts possible
const outputMedia = new Media(...)
const users = [new User(...), new User(...)]
                                       
const seq = new Sequence(users,outputMedia, videoLayout, encodingOptions)
OR
const seq = new Sequence(users,outputMedia, videoLayout)

```



## TODO

- [x] link user to video audio file
- [x] user with audio, no video, but active speaker -> placeholder
- [ ] implement custom user priority map
- [ ] video cover option for layout boxes (now only fit )





