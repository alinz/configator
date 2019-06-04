import { createReadStream, createWriteStream } from 'fs'

import { parse as csvReader } from '~/src/csv-reader'
import { write as tableWrite } from '~/src/table-writer'

export const convert = async (csvPath: string, tablePath: string) => {
  const csv = createReadStream(csvPath)
  const table = createWriteStream(tablePath)

  const objMap = await csvReader(csv)
  tableWrite(objMap, table)
}
