import { createReadStream } from 'fs'

import { parse } from '~/src/csv-reader/index'

describe('markdown table parser', () => {
  test('samples', async () => {
    const testCases = [
      {
        given: createReadStream(`${__dirname}/samples/sample2.csv`),
        expected: {
          headers: ['header1', 'header2', 'header3'],
          data: [{ header1: '1', header2: '2', header3: '3' }],
        },
      },
      {
        given: createReadStream(`${__dirname}/samples/sample1.csv`),
        expected: {
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
        },
      },
    ]

    for (const testCase of testCases) {
      const data = await parse(testCase.given)
      expect(data).toStrictEqual(testCase.expected)
    }
  })
})
