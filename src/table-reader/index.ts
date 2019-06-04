import { Readable } from 'stream'

import { Tokenizer, createIsFn } from 'core-parser'

import { tokenizer, Kind } from './lexer'

const isPipe = createIsFn(Kind.PIPE)
const isNewLine = createIsFn(Kind.NEW_LINE)
const isEOF = createIsFn(Kind.EOF)
const isConstant = createIsFn(Kind.CONSTANT)

const wrapWithQuotes = (value: string) => {
  value = value.trim()
  return value.length > 0 && value.indexOf(',') !== -1 ? `"${value}"` : value
}

type Result = {
  headers: string[]
  data: { [key: string]: string }[]
}

class TableParser {
  lexer: Tokenizer<Kind>

  headers: string[]
  data: { [key: string]: string }[]

  constructor(source: Readable) {
    this.lexer = tokenizer(source)
    this.headers = []
    this.data = []
  }

  headersState = async () => {
    let token = await this.lexer.next()
    if (!isPipe(token)) {
      throw new Error(`should got pipe but got ${token.kind}`)
    }

    while (true) {
      token = await this.lexer.next()
      if (isEOF(token) || isNewLine(token)) {
        break
      } else if (isConstant(token)) {
        this.headers.push(wrapWithQuotes(token.value))
      }
    }

    // pass through split line under header section
    while (true) {
      token = await this.lexer.next()
      if (isEOF(token) || isNewLine(token)) {
        break
      }
    }

    return this.dataState
  }

  dataState = async () => {
    let data: { [key: string]: string } = {}
    let idx = -1

    while (true) {
      const token = await this.lexer.next()
      if (isNewLine(token)) {
        this.data.push(data)
        data = {}
        idx = -1
      } else if (isEOF(token)) {
        if (Object.keys(data).length > 0) {
          this.data.push(data)
        }
        break
      } else if (isPipe(token)) {
        idx++
      } else if (isConstant(token)) {
        data[this.headers[idx]] = wrapWithQuotes(token.value)
      }
    }

    return null
  }

  async parse(): Promise<Result> {
    let state = this.headersState
    while (state) {
      state = await state()
    }

    return { headers: this.headers, data: this.data }
  }
}

export const parse = (source: Readable): Promise<Result> => {
  const parser = new TableParser(source)
  return parser.parse()
}
