import { Readable, Writable } from 'stream'

export class ReadableBuffer extends Readable {
  constructor(buffer: Buffer) {
    super()

    this.push(buffer)
    this.push(null)
  }

  _read() {}
}

export class WritableBuffer extends Writable {
  buff: string[]
  constructor() {
    super()
    this.buff = []
  }

  _write(chunk, encoding, callback) {
    this.buff.push(chunk.toString())
    callback()
  }

  get buffer() {
    return this.buff.join('')
  }
}
