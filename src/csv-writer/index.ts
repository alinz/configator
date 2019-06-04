import { Writable } from 'stream'

import { asyncWrite } from '~/src/pkg/io'

type DataInput = {
  headers: string[]
  data: { [key: string]: string }[]
}

export const write = async (data: DataInput, output: Writable) => {
  // const content = await readAll(input)
  // const data = JSON.parse(content) as DataInput

  await asyncWrite(data.headers.join(','), output)

  for (const d of data.data) {
    await asyncWrite('\n', output)

    let firstItem = true
    for (const header of data.headers) {
      if (!firstItem) {
        await asyncWrite(',', output)
      }
      await asyncWrite(d[header], output)
      firstItem = false
    }
  }
}
