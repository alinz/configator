import { createReadStream, createWriteStream } from 'fs'

import { parse as tableReader } from '~/src/table-reader'
import { write as csvWriter } from '~/src/csv-writer'

export const convert = async (tablePath: string, csvPath: string) => {
  const table = createReadStream(tablePath)
  const csv = createWriteStream(csvPath)

  const objMap = await tableReader(table)
  csvWriter(objMap, csv)
}
