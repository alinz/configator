import { Writable } from 'stream'

import { asyncWrite } from '~/src/pkg/io'

type DataInput = {
  headers: string[]
  data: { [key: string]: string }[]
}

const appendSpaceAfterValue = (value: string, spaces: number, extra: number): string => {
  let delta = spaces - value.length + extra
  if (delta <= 0) {
    delta = 1
  }
  return ` ${value + ' '.repeat(delta)}`
}

const appendSpaceLines = (spaces: number): string => {
  spaces = spaces === 0 ? 1 : spaces + 1
  if (spaces > 2) {
    spaces -= 1
  }

  return '-'.repeat(spaces)
}

const tableSplinter = (headers: string[], lengths: { [key: string]: number }) => {
  const columns = []

  for (const header of headers) {
    columns.push('|')
    columns.push(appendSpaceAfterValue(appendSpaceLines(lengths[header]), lengths[header], 0))
  }
  columns.push('|')

  return columns.join('')
}

const tableRow = (headers: string[], data: { [key: string]: string }, lengths: { [key: string]: number }, extra: number = 0): string => {
  const columns = []

  for (const header of headers) {
    columns.push('|')
    columns.push(appendSpaceAfterValue(data[header] || '', lengths[header], extra))
  }
  columns.push('|')

  return columns.join('')
}

export const write = async (items: DataInput, output: Writable) => {
  const { headers, data } = items

  // need to find the longest string in each column
  // first initialize the header length
  const lengths: { [key: string]: number } = headers.reduce((lengths, header: string) => {
    lengths[header] = header.length
    return lengths
  }, {})

  // go through each column of data and see if column is longer
  data.forEach((item) => {
    Object.keys(item).forEach((header) => {
      if (lengths[header] < item[header].length) {
        lengths[header] = item[header].length
      }
    })
  })

  await asyncWrite(
    tableRow(
      headers,
      headers.reduce((item, header) => {
        item[header] = header
        return item
      }, {}),
      lengths,
      1,
    ),
    output,
  )

  await asyncWrite('\n', output)

  await asyncWrite(tableSplinter(headers, lengths), output)

  for (const item of data) {
    await asyncWrite('\n', output)
    await asyncWrite(tableRow(headers, item, lengths, 1), output)
  }
}
