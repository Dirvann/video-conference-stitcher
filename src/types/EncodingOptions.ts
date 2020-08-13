declare interface EncodingOptions {
  crf?:number
  bitrate?:string
  size:Size,
  loglevel?:number| 'quiet' | 'panic' | 'fatal' | 'error' | 'warning' | 'info' | 'verbose' | 'debug' | 'trace'
}