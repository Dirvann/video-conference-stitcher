import express from 'express'
import config from './config'
import Video from './modules/Video'
import path from 'path'
import Sequence from './modules/Sequence'
import MosaicLayout from './modules/layouts/MosaicLayout'
import GridLayout from './modules/layouts/GridLayout'
import fs from 'fs'
import colors from 'colors'
import PresenterLayout from './modules/layouts/PresenterLayout'
import WaveformData from 'waveform-data'
import decode from 'audio-decode'
import {AudioContext} from 'web-audio-api'
const app = express()


app.get('/', async (req, res) => {
  console.log('got request')
  res.send('hey')
})

function command(encode:boolean=true) {
  const videoFolder = path.join(__dirname, '../videos')
  const videos: Video[] = [
    new Video(path.join(videoFolder, 'vid1.mp4'), 0),
    new Video(path.join(videoFolder, 'vid2.mp4'), 5000),
    new Video(path.join(videoFolder, 'vid3.mp4'), 5000),
    new Video(path.join(videoFolder, 'vid3.mp4'), 6000),
    new Video(path.join(videoFolder, 'vid3.mp4'), 5000),
    new Video(path.join(videoFolder, 'vid3.mp4'), 5000),
    new Video(path.join(videoFolder,'vid4.mp4'), 2000),
    new Video(path.join(videoFolder,'vid4.mp4'), 4000),
    new Video(path.join(videoFolder,'vid5.mp4'), 3000),
    new Video(path.join(videoFolder,'vid5.mp4'), 0),
    new Video(path.join(videoFolder,'vid-spie-40.mp4'), 2000),
    // new Video(path.join(videoFolder,'vid-spie-40.mp4'), 8000),
    new Video(path.join(videoFolder,'vid-spie-60.mp4'), 0)
  ]
  const videoOut: Video = new Video(path.join(__dirname, '../videos', 'present_720.mp4'), -1)
  const encodingOptions: EncodingOptions = {
    crf: 20,
    loglevel: 'verbose',
    size:{
      w: 1280,
      h: 720
    }
  }
  const layout:VideoLayout = new PresenterLayout()

  Promise.resolve().then(async () => {

    const sequence: Sequence = new Sequence(0, videos,videoOut, layout, encodingOptions)
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

function printAudio() {
  
}

app.listen(config.server.port, () => {
  console.log(`listening on port ${config.server.port}`)
})

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
  if(text === 'l') {
    (new MosaicLayout()).getBoxes(10,{w:400,h:400})
  }
  
  if(text === 'a') {
    const videoFolder = path.join(__dirname, '../videos')
    const buffer:Buffer = fs.readFileSync(path.join(videoFolder, 'vid1.mp3'))


    /**/
      // arr.push(Math.round(sub/(Math.floor(file.length/100))))
    colors.setTheme({
      info: 'bgGreen',
      help: 'cyan',
      warn: 'yellow',
      success: 'bgBlue',
      error: 'red'
    })

    decode(buffer).then((audioBuffer: AudioBuffer) => {
      // console.log(audioBuffer)
      // const audioContext = new AudioContext()
      /*const options = {
        audio_context: audioContext,
        audio_buffer: audioBuffer,
        scale: 128
      }
      WaveformData.createFromAudio(options,(err,wave) => {
        if(err) {
          console.error(colors.red(err.toString()))
        }
        console.log(wave)
      })*/
      let max = 0
      audioBuffer.getChannelData(0).forEach((val:number,hello) => {
        val > max?'':max=val
      })
      let dat = audioBuffer.getChannelData(1)

      let arr:number[] = []

      for(let i=0; i < dat.length; i+= Math.floor(dat.length/100)) {
        let tmp = 0
        for(let j=i; j < i+Math.floor(dat.length/100); j++) {
          tmp += dat[j]
        }
        arr.push(tmp/dat.length*100*100*1000)
      }
      console.log(arr)
      console.log(max.toString().error)

      fs.writeFileSync('out.txt', audioBuffer.getChannelData(0).toString(), 'utf-8')
    }).catch((err: any) => {
      console.error(colors.blue('some error'))
      // @ts-ignore
      console.log('red'.error)
      console.log(err)
    })
    
  }

  if (text === 'quit') {
    process.exit()
  }
})