import { createReadStream, createWriteStream } from 'fs'
import { Readable } from 'stream'

import { asyncWrite } from '~/src/pkg/io'
import { removeQuotes } from '~/src/pkg/strings'
import { parse as tableParse } from '~/src/table-reader'

import * as ast from './ast'
import { ConfigItem, RangeNumber, RangeValue, ConfigItemType } from './types'

const isTypeCorrect = (type: string): boolean => {
  return ['boolean', 'number', 'function', 'string', 'range', 'multi'].indexOf(type) !== -1
}

const parseRange = (value: string): RangeNumber | RangeValue => {
  if (value.indexOf('..') !== -1) {
    const [min, max] = value.split('..')
    return {
      type: 'number',
      min: Number(min),
      max: Number(max),
    }
  } else {
    const values = removeQuotes(value).split(',')
    return {
      type: 'single',
      values,
    }
  }
}

// phase 1 read the markdown table and convert it into clean and normalized json object
export const phase1 = async (input: Readable) => {
  const parsed = await tableParse(input)

  // Property
  // Type
  // Range
  // Default
  // Description
  const json = parsed.data.reduce(
    (base, item) => {
      // make all the properties of config item lowercase
      const configItem: ConfigItem = {} as any

      // check if type is correct
      if (!isTypeCorrect(item.Type)) {
        throw new Error(`unknown type ${item.Type}`)
      }

      configItem.property = item.Property
      configItem.description = item.Description
      configItem.type = item.Type as ConfigItemType

      switch (configItem.type) {
        case 'range':
          configItem.range = parseRange(removeQuotes(item.Range))
          if (configItem.range.type === 'number') {
            configItem.default = Number(item.Default)
          } else {
            configItem.default = item.Default
          }
          break
        case 'multi':
          configItem.range = { type: 'multiple', values: removeQuotes(item.Range).split(',') }
          configItem.default = removeQuotes(item.Default)
          break
        case 'boolean':
          configItem.default = item.Default === 'true'
          break
        case 'number':
          if (item.Default !== '') {
            configItem.default = Number(item.Default)
          }
          break
        case 'string':
          configItem.default = item.Default
          configItem.range = null
      }

      base[item.Property] = configItem as any
      return base
    },
    {} as { [key: string]: ConfigItem },
  )

  return json
}

// generate base config file
export const generateBaseConfig = (base: { [key: string]: ConfigItem }) => {
  return Object.keys(base).reduce((baseConfig: { [key: string]: any }, key: string) => {
    if (base[key].default !== '') {
      baseConfig[key] = typeof base[key].default === 'string' ? removeQuotes(base[key].default) : base[key].default
    } else {
      baseConfig[key].default = undefined
    }
    return baseConfig
  }, {})
}

// phase2 create a nested object, we need this transformation for
// creating typescript templates
// for example:
/*
    {
      "a.b.c": {
        "description": "c",
        ...
      },
      "a.b.d": {
        "description": "d",
        ...
      }
    }

    {
      "a": {
        "b": {
          "c": {
            "description": "c",
            ...
          },
          "d": {
            "description": "d",
            ...
          }
        }
      }
    }
*/
export const expandConfigItem = (map: { [key: string]: ConfigItem }) => {
  const p2 = {}
  Object.keys(map).forEach((originalName) => {
    let target = p2
    // originalName
    const segments = originalName.split('.')
    segments.forEach((segment, i) => {
      if (!target[segment]) {
        if (i == segments.length - 1) {
          target[segment] = map[originalName]
          return
        } else {
          target[segment] = {}
        }
      }
      target = target[segment]
    })
  })

  return p2
}

/* 
    {
      "a": {
        "b": {
          "c": {
            "name": "a.b.c",
            "description": "c",
            ...
          },
          "d": {
            "name": "a.b.d",
            "description": "d",
            ...
          }
        }
      }
    }

    export const base = {
      'a.b.c': '',
      'a.b.d': 100
    }

    export const config = (conf: { [key: string]: any }) => {
      const update = {
        a: {
          b: {
            // description
            // ...
            c: (val: boolean) => {
              conf['a.b.c'] = val
              return update
            },
            // description
            // ...
            d: (val: number) => {
              conf['a.b.d'] = val
              return update
            }
          }
        }
      }

      return update
    }

    const conf = topicConsumer.update.
      a.b.c("").
      a.b.d("hahaha")

*/
export const convert = async (tablePath: string, tsPath: string) => {
  const table = createReadStream(tablePath)
  const ts = createWriteStream(tsPath)

  const configItemMap = await phase1(table)
  const expandedConfigItemMap = expandConfigItem(configItemMap)
  const baseConfig = generateBaseConfig(configItemMap)
  const sourceCode = ast.exec(expandedConfigItemMap, baseConfig)

  await asyncWrite(sourceCode, ts)
  ts.close()
}
