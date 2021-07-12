declare interface Size {
  w:number
  h:number
}

declare interface EncodingOptions {
  crf?:number
  bitrate?:string
  size:Size,
  loglevel?:number| 'quiet' | 'panic' | 'fatal' | 'error' | 'warning' | 'info' | 'verbose' | 'debug' | 'trace',
  showTimeStamp?:boolean,
  timeStampStartTime?:number,
  /**
   * number of the gmt time offset in hours (can be positive or negative)
   */
  gmtTimeOffset?:number
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