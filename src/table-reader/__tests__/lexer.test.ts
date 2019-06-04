import { createReadStream } from 'fs'

import { tokenizer } from '~/src/table-reader/lexer'

// PIPE     = 0
// CONSTANT = 1
// NEW_LINE = 2
// SPLIT    = 3
// EOF      = 4

describe('markdown table lexer', () => {
  test('samples', async () => {
    const testCases = [
      {
        given: createReadStream(`${__dirname}/samples/sample1.txt`),
        expected: [
          { kind: 0, value: '|' },
          { kind: 1, value: ' header 1 ' },
          { kind: 0, value: '|' },
          { kind: 1, value: ' header 2 ' },
          { kind: 0, value: '|' },
          { kind: 1, value: ' header3 ' },
          { kind: 0, value: '|' },
          { kind: 2, value: '\n' },
          { kind: 0, value: '|' },
          { kind: 3, value: '----------' },
          { kind: 0, value: '|' },
          { kind: 3, value: '----------' },
          { kind: 0, value: '|' },
          { kind: 3, value: '---------' },
          { kind: 0, value: '|' },
          { kind: 2, value: '\n' },
          { kind: 0, value: '|' },
          { kind: 1, value: ' value 2  ' },
          { kind: 0, value: '|' },
          { kind: 1, value: ' value 2  ' },
          { kind: 0, value: '|' },
          { kind: 1, value: '         ' },
          { kind: 0, value: '|' },
          { kind: 4, value: '' },
        ],
      },
      {
        given: createReadStream(`${__dirname}/samples/sample2.txt`),
        expected: [
          { kind: 0, value: '|' },
          { kind: 1, value: ' header 1 ' },
          { kind: 0, value: '|' },
          { kind: 1, value: ' header 2 ' },
          { kind: 0, value: '|' },
          { kind: 1, value: ' header3 ' },
          { kind: 0, value: '|' },
          { kind: 2, value: '\n' },
          { kind: 0, value: '|' },
          { kind: 3, value: '----------' },
          { kind: 0, value: '|' },
          { kind: 3, value: '----------' },
          { kind: 0, value: '|' },
          { kind: 3, value: '---------' },
          { kind: 0, value: '|' },
          { kind: 2, value: '\n' },
          { kind: 0, value: '|' },
          { kind: 1, value: ' value 2  ' },
          { kind: 0, value: '|' },
          { kind: 1, value: ' value 2  ' },
          { kind: 0, value: '|' },
          { kind: 1, value: '         ' },
          { kind: 0, value: '|' },
          { kind: 4, value: '' },
        ],
      },
    ]

    for (const testCase of testCases) {
      let idx = 0
      const toks = tokenizer(testCase.given)

      let tok
      while ((tok = await toks.next())) {
        expect(tok.toJSON()).toStrictEqual(testCase.expected[idx])
        idx++
      }
    }
  })
})
