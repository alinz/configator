import { ReadableBuffer } from '~/src/pkg/buffer'

import { phase1, generateBaseConfig, expandConfigItem } from '../index'

describe('table-to-typescript', () => {
  test('phase 1', async () => {
    const given = `
| Property | Type   | Range | Default | Description    |
|----------|--------|-------|---------|----------------|
| a.b.c    | range  | 1..10 | 5       | awesome value1 |
| a.b.d    | range  | a,b,c | b       | awesome value2 |
| a.b.e    | multi  | a,b,c | b,a     | awesome value3 |
    `

    const expected = {
      'a.b.c': {
        property: 'a.b.c',
        type: 'range',
        range: { type: 'number', min: 1, max: 10 },
        default: 5,
        description: 'awesome value1',
      },
      'a.b.d': {
        property: 'a.b.d',
        type: 'range',
        range: { type: 'single', values: ['a', 'b', 'c'] },
        default: 'b',
        description: 'awesome value2',
      },
      'a.b.e': {
        property: 'a.b.e',
        type: 'multi',
        range: { type: 'multiple', values: ['a', 'b', 'c'] },
        default: 'b,a',
        description: 'awesome value3',
      },
    }

    try {
      const value = await phase1(new ReadableBuffer(given))
      expect(value).toStrictEqual(expected)
    } catch (e) {
      throw e
    }
  })

  test('generateBaseConfig', async () => {
    const given = `
| Property | Type   | Range | Default | Description    |
|----------|--------|-------|---------|----------------|
| a.b.c    | range  | 1..10 | 5       | awesome value1 |
| a.b.d    | range  | a,b,c | b       | awesome value2 |
| a.b.e    | multi  | a,b,c | b,a     | awesome value3 |
    `

    const expected = { 'a.b.c': 5, 'a.b.d': 'b', 'a.b.e': 'b,a' }

    const value = await phase1(new ReadableBuffer(given))
    expect(generateBaseConfig(value)).toStrictEqual(expected)
  })

  test('expandConfigItem', async () => {
    const given = `
| Property | Type   | Range | Default | Description    |
|----------|--------|-------|---------|----------------|
| a.b.c    | range  | 1..10 | 5       | awesome value1 |
| a.b.d    | range  | a,b,c | b       | awesome value2 |
| a.b.e    | multi  | a,b,c | b,a     | awesome value3 |
    `

    const expected = {
      a: {
        b: {
          c: { property: 'a.b.c', description: 'awesome value1', type: 'range', range: { type: 'number', min: 1, max: 10 }, default: 5 },
          d: { property: 'a.b.d', description: 'awesome value2', type: 'range', range: { type: 'single', values: ['a', 'b', 'c'] }, default: 'b' },
          e: {
            property: 'a.b.e',
            description: 'awesome value3',
            type: 'multi',
            range: { type: 'multiple', values: ['a', 'b', 'c'] },
            default: 'b,a',
          },
        },
      },
    }

    const value = await phase1(new ReadableBuffer(given))

    expect(expandConfigItem(value)).toStrictEqual(expected)
  })
})
