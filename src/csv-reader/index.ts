import { Readable } from 'stream'
import { Tokenizer, createIsFn } from 'core-parser'

import { removeQuotes } from '~/src/pkg/strings'
import { tokenizer, Kind } from './lexer'

const isConstant = createIsFn(Kind.CONSTANT)
const isNewLine = createIsFn(Kind.NEW_LINE)
const isSplit = createIsFn(Kind.SPLIT)
const isEOF = createIsFn(Kind.EOF)

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
    while (true) {
      const tok = await this.lexer.next()
      if (isNewLine(tok)) {
        break
      }

      if (isConstant(tok)) {
        this.headers.push(removeQuotes(tok.value.trim()))
      }
    }

    return this.dataState
  }

  dataState = async () => {
    let idx = 0
    let data: { [key: string]: string } = {}
    while (true) {
      const tok = await this.lexer.next()

      if (!tok || isEOF(tok)) {
        if (Object.keys(data).length > 0) {
          this.data.push(data)
        }
        break
      }

      if (isNewLine(tok)) {
        this.data.push(data)
        data = {}
        idx = 0
      } else if (isConstant(tok)) {
        data[this.headers[idx]] = removeQuotes(tok.value.trim())
      } else if (isSplit(tok)) {
        idx++
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
