import { ReadableBuffer, WritableBuffer } from '../index'

describe('buffer', () => {
  test('sample', async () => {
    const input = new ReadableBuffer(Buffer.from('hello world'))
    const output = new WritableBuffer()

    return new Promise((resolve) => {
      input
        .pipe(
          output,
          { end: true },
        )
        .on('finish', () => {
          expect(output.buffer).toBe('hello world')
          resolve()
        })
    })
  })
})
