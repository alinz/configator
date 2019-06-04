import { Readable, Writable } from 'stream'

export const readAll = (input: Readable): Promise<string> => {
  let content = ''
  return new Promise((resolve, reject) => {
    input.on('data', (data) => {
      content += data
    })

    input.on('error', (err) => {
      reject(err)
    })

    input.on('end', () => {
      resolve(content)
    })
  })
}

export const asyncWrite = (data: string, w: Writable) => {
  return new Promise((resolve, reject) => {
    w.write(data, (err) => {
      if (err) {
        reject(err)
        return
      }

      resolve()
    })
  })
}
