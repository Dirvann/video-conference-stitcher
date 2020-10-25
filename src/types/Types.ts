declare interface Size {
  w:number
  h:number
}

declare interface EncodingOptions {
  crf?:number
  bitrate?:string
  size:Size,
  loglevel?:number| 'quiet' | 'panic' | 'fatal' | 'error' | 'warning' | 'info' | 'verbose' | 'debug' | 'trace'
}

declare interface VideoBox {
  w:number
  h:number
  x:number
  y:number
}

declare interface VideoLayout {
  getBoxes(n:number,size:Size) :VideoBox[]
}