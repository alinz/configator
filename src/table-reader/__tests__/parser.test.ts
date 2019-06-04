import { createReadStream } from 'fs'

import { parse } from '~/src/table-reader/index'

describe('markdown table parser', () => {
  test('samples', async () => {
    const testCases = [
      {
        given: createReadStream(`${__dirname}/samples/sample1.txt`),
        expected: {
          headers: ['header 1', 'header 2', 'header3'],
          data: [{ 'header 1': 'value 2', 'header 2': 'value 2', header3: '' }],
        },
      },
      {
        given: createReadStream(`${__dirname}/samples/sample2.txt`),
        expected: { headers: ['header 1', 'header 2', 'header3'], data: [{ 'header 1': 'value 2', 'header 2': 'value 2', header3: '' }] },
      },
    ]

    for (const testCase of testCases) {
      const data = await parse(testCase.given)
      expect(data).toStrictEqual(testCase.expected)
    }
  })
})
