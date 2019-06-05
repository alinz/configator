import { Readable, Writable } from 'stream'

export class ReadableBuffer extends Readable {
  constructor(buffer: Buffer | string) {
    super({ read: () => {} })

    const content = typeof buffer === 'string' ? Buffer.from(buffer) : buffer

    this.push(content)
    setTimeout(() => this.push(null), 0)
  }
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
