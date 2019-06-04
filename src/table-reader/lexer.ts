import { Readable } from 'stream'

import { createState, createTokenizer, Lexer, Pusher, Token } from 'core-parser'

/* 

markdown table could be like this:

| header 1 | header 2 | header3 |
|----      |----------|---------|
| value 2  | value    |         |

the generated tokens should be as follows

PIPE, CONSTANT, PIPE, CONSTANT, PIPE, CONSTANT, NEW_LINE
PIPE, SPLIT, PIPE, SPLIT, PIPE, SPLIT, NEW_LINE
PIPE, CONSTANT, PIPE, CONSTANT, PIPE, CONSTANT, EOF

*/

export enum Kind {
  PIPE,
  CONSTANT,
  NEW_LINE,
  SPLIT,
  EOF,
}

const pipeState = createState(async (l: Lexer, pusher: Pusher<Kind>) => {
  await l.next()
  pusher.push(new Token(Kind.PIPE, l.content()))
  l.ignore()

  return mainState
})

const splitState = createState(async (l: Lexer, pusher: Pusher<Kind>) => {
  await l.acceptRunUntil('|')
  pusher.push(new Token(Kind.SPLIT, l.content()))
  l.ignore()

  return mainState
})

const newlineState = createState(async (l: Lexer, pusher: Pusher<Kind>) => {
  await l.next()
  pusher.push(new Token(Kind.NEW_LINE, l.content()))
  l.ignore()

  return ignoreState
})

const eofState = createState(async (l: Lexer, pusher: Pusher<Kind>) => {
  await l.next()
  pusher.push(new Token(Kind.EOF, ''))
  l.ignore()

  return null
})

const constantState = createState(async (l: Lexer, pusher: Pusher<Kind>) => {
  await l.acceptRunUntil('|')
  pusher.push(new Token(Kind.CONSTANT, l.content()))
  l.ignore()

  return mainState
})

const ignoreState = createState(async (l: Lexer, pusher: Pusher<Kind>) => {
  // ignore everything until `|`
  await l.acceptRunUntil('|')
  l.ignore()

  return mainState
})

const mainState = createState(async (l: Lexer, pusher: Pusher<Kind>) => {
  switch (await l.peek(1)) {
    case '|':
      return pipeState
    case '-':
      return splitState
    case '\n':
      return newlineState
    case null:
      return eofState
    default:
      return constantState
  }
})

export const tokenizer = (source: Readable) => createTokenizer<Kind>(source, ignoreState)
