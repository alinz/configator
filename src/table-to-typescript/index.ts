import { createReadStream } from 'fs'

import { parse as tableParse } from '~/src/table-reader'
import * as ast from './ast'

interface RangeNumber {
  min: number
  max: number
}

interface RangeValue {
  type: 'single' | 'multiple'
  values: string
}

interface ConfigItem {
  property: string
  type: 'boolean' | 'number' | 'function' | 'string' | 'range'
  range: RangeNumber | RangeValue
  default: string
  description: string
}

// phase 1 read the markdown table and convert it into clean and normalized json object
const phase1 = async (filename) => {
  const input = createReadStream(filename)
  const parsed = await tableParse(input)

  // Property
  // Type
  // Range
  // Default
  // Description
  const json = parsed.data.reduce((base, item) => {
    const name = item.Property

    const defaultValue = item.Default
    let type
    if (defaultValue === 'false' || defaultValue == 'true') {
      type = 'boolean'
    } else if (defaultValue === '') {
      switch (name) {
        case 'bootstrap.servers':
        case 'metadata.broker.list':
        case 'topic.blacklist':
        case 'debug':
        case 'compression.type':
          type = 'string'
          break
        case 'max.in.flight':
        case 'acks':
          type = 'number'
          break
        case 'enable.auto.commit':
          type = 'boolean'
          break
        default:
          type = 'Function'
      }
    } else {
      const val = Number(defaultValue)
      if (isNaN(val)) {
        type = 'string'
      } else {
        type = 'number'
      }
    }

    const description = item.Description || ''

    base[name] = {
      name: name,
      description: description.trim(),
      defaultValue: defaultValue.trim(),
      type: type,
    }

    return base
  }, {})

  return json
}

// generate base config file
const phase1_1 = (filename) => {
  const p1 = phase1(filename)

  const original = Object.keys(p1).reduce((base: { [key: string]: any }, key: string) => {
    if (p1[key].defaultValue !== '') {
      base[key] = p1[key].defaultValue
    } else {
      p1[key].defaultValue = undefined
    }
    return base
  }, {})

  return [p1, original]
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
const phase2 = (filename) => {
  const [p1, original] = phase1_1(filename)

  const p2 = {}
  Object.keys(p1).forEach((originalName) => {
    let target = p2
    // originalName
    const segments = originalName.split('.')
    segments.forEach((segment, i) => {
      if (!target[segment]) {
        if (i == segments.length - 1) {
          target[segment] = p1[originalName]
          return
        } else {
          target[segment] = {}
        }
      }
      target = target[segment]
    })
  })

  return [p2, original]
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
const phase3 = (filename) => {
  const [obj, original] = phase2(filename)
  const content = ast.exec(obj, original)
  console.log(content)
}
