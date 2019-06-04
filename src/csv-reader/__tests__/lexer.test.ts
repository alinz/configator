import { createReadStream } from 'fs'

import { tokenizer } from '~/src/csv-reader/lexer'

describe('lexer for csv-reader', () => {
  test('samples', async () => {
    const testCases = [
      {
        given: createReadStream(`${__dirname}/samples/sample1.csv`),
        expected: [
          { kind: 0, value: 'header1' },
          { kind: 1, value: ',' },
          { kind: 0, value: ' header 2' },
          { kind: 1, value: ',' },
          { kind: 0, value: ' "header,3"' },
          { kind: 2, value: '\n' },
          { kind: 0, value: '1' },
          { kind: 1, value: ',' },
          { kind: 0, value: '2' },
          { kind: 1, value: ',' },
          { kind: 0, value: '3' },
          { kind: 2, value: '\n' },
          { kind: 0, value: '2' },
          { kind: 1, value: ',' },
          { kind: 0, value: '"3,5"' },
          { kind: 1, value: ',' },
          { kind: 0, value: '4' },
          { kind: 3, value: null },
        ],
      },
    ]

    for (const testCase of testCases) {
      let idx = 0
      const toks = tokenizer(testCase.given)
      while (true) {
        const tok = await toks.next()
        if (!tok) {
          break
        }

        expect(tok.toJSON()).toStrictEqual(testCase.expected[idx])
        idx++
      }

      expect(idx).toBe(testCase.expected.length)
    }
  })
})
