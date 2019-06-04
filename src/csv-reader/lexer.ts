import { Readable } from 'stream'
import { createTokenizer, Token, Lexer, createState, Pusher } from 'core-parser'

/* 

csv data would be like this:

header1, header 2, "header,3"
1,2,3
2,"3,5",4

CONSTANT, SPLIT, CONSTANT, SPLIT, CONSTANT, SPLIT,
CONSTANT, SPLIT, CONSTANT, SPLIT, CONSTANT, SPLIT,
CONSTANT, SPLIT, CONSTANT, SPLIT, CONSTANT, SPLIT,

*/

export enum Kind {
  CONSTANT,
  SPLIT,
  NEW_LINE,
  EOF,
}

const constantState = createState(async (lexer: Lexer, pusher: Pusher<Kind>) => {
  await lexer.acceptRunUntil('",\n\0')

  const next = await lexer.peek(1)

  if (next === '"') {
    await lexer.next()
    await lexer.acceptRunUntil('"')
    await lexer.acceptRunUntil(',\n')
  }

  pusher.push(new Token(Kind.CONSTANT, lexer.content()))
  lexer.ignore()

  return mainState
})

const splitState = createState(async (lexer: Lexer, pusher: Pusher<Kind>) => {
  await lexer.next()
  pusher.push(new Token(Kind.SPLIT, lexer.content()))
  lexer.ignore()

  return mainState
})

const newLineState = createState(async (lexer: Lexer, pusher: Pusher<Kind>) => {
  await lexer.next()
  pusher.push(new Token(Kind.NEW_LINE, lexer.content()))
  lexer.ignore()

  return mainState
})

const eofState = createState(async (lexer: Lexer, pusher: Pusher<Kind>) => {
  await lexer.next()
  pusher.push(new Token(Kind.EOF, null))
  lexer.ignore()

  return null
})

const mainState = createState(async (l: Lexer, pusher: Pusher<Kind>) => {
  switch (await l.peek(1)) {
    case ',':
      return splitState
    case '\n':
      return newLineState
    case null:
      return eofState
    default:
      return constantState
  }
})

export const tokenizer = (source: Readable) => createTokenizer<Kind>(source, constantState)
