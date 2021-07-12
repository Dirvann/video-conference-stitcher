import Media from './Media'

export default class User {
  public id: string | number
  public media: Media[]
  public readonly name: string
  public background:string|undefined
  constructor(id:string|number,media:Media[], name?:string|undefined, background?:string|undefined) {
    this.id = id
    this.name = name || id.toString()
    media.forEach(med => {
      med.user = this
    })
    this.media = media
    this.background = background
  }

  public addMedia(...media:Media[]):void {
    media.forEach(med => {
      med.user = this
    })
    this.media.push(...media)
  }
}
