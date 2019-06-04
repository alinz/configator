import { WritableBuffer } from '~/src/pkg/buffer'
import { write } from '../index'

describe('csv-writer', () => {
  test('', async () => {
    const given = {
      headers: ['header1', 'header 2', '"header,3"'],
      data: [
        {
          header1: '1',
          'header 2': '2',
          '"header,3"': '3',
        },
        {
          header1: '2',
          'header 2': '"3,5"',
          '"header,3"': '4',
        },
      ],
    }

    const expected = `
header1,header 2,"header,3"
1,2,3
2,"3,5",4      
      `.trim()

    const output = new WritableBuffer()

    await write(given, output)

    expect(output.buffer).toBe(expected)
  })
})
