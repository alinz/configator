import program from 'commander'

import { convert as tableToCSV } from '~/src/table-to-csv'
import { convert as csvToTable } from '~/src/csv-to-table'
import { convert as tableToTypescript } from '~/src/table-to-typescript'

const onlyOne = (...args: boolean[]) => {
  const count = args.reduce((count, arg) => {
    if (arg) {
      count++
    }
    return count
  }, 0)

  return count === 1
}

const run = async () => {
  program
    .version('0.1.0')
    .option('-i --input <input>', 'input file')
    .option('-o --output <output>', 'output file')
    .option('--csv')
    .option('--table')
    .option('--typescript')
    .parse(process.argv)

  const { input, output, csv, table, typescript } = program

  if (!onlyOne(csv, table, typescript)) {
    throw new Error('provide one of --csv, --table or --typescript')
  }

  // convert table to csv
  if (csv) {
    await tableToCSV(input, output)
  }
  // convert csv to table
  else if (table) {
    await csvToTable(input, output)
  }
  // convert table to typescript
  else if (typescript) {
    await tableToTypescript(input, output)
  }
  // the last line should never happen
  else {
    throw new Error('this should not happen')
  }
}

const main = async () => {
  try {
    await run()
  } catch (e) {
    console.error(`Error: ${e.message}`)
  }
}

main()
