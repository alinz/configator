import * as ts from 'typescript'

import * as ast from '~/src/table-to-typescript/ast'

const output = (val) => {
  return ast.print(ts.updateSourceFileNode(ts.createSourceFile('temporary.tsx', '', ts.ScriptTarget.Latest), [val])).trim()
}

describe('ast test', () => {
  test('createMaSetter', () => {
    const value = ast.createMapSetter('a', 'b', 'update')
    expect(output(value)).toBe('a["b"] = update;')
  })

  test('createReturnBlock', () => {
    const value = ast.createReturnBlock('awesomeness')
    expect(output(value)).toBe('return awesomeness;')
  })

  test('createSetterFunc', () => {
    const value = ast.createSetterFunc('a', 'b', 'cool', 'boolean')

    const expected = `
(val: boolean) => {
    a["b"] = val;
    return cool;
} 
    `

    expect(output(value)).toBe(expected.trim())
  })

  test('createFlatMap', () => {
    const objs = [
      {
        given: { b: 1 },
        expected: `a = { "b": 1 }`,
      },
      {
        given: { b: 'hello' },
        expected: `a = { "b": "hello" }`,
      },
      {
        given: { b: false },
        expected: `a = { "b": false }`,
      },
      {
        given: { b: undefined },
        expected: `a = { "b": undefined }`,
      },
      {
        given: { b: 1, c: 10 },
        expected: `a = { "b": 1, "c": 10 }`,
      },
    ]

    objs.forEach((obj) => {
      const value = ast.createFlatMap('a', obj.given)
      expect(output(value)).toBe(obj.expected.trim())
    })
  })

  test('createExport', () => {
    const objs = [
      {
        given: ast.createFlatMap('a', { b: 1 }),
        expected: `export const a = { "b": 1 };`,
      },
      {
        given: ast.createFlatMap('a', { b: 'hello' }),
        expected: `export const a = { "b": "hello" };`,
      },
    ]

    objs.forEach((obj) => {
      const value = ast.createExport(obj.given)
      expect(output(value)).toBe(obj.expected.trim())
    })
  })

  test('createConfig', () => {
    const obj = {
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

    const expected = `
config = (conf: {
    [key: string]: any;
}) => {
    const update = { a: { b: { c: (val: number) => {
                    conf["a.b.c"] = val;
                    return update;
                }, d: (val: "a" | "b" | "c") => {
                    conf["a.b.d"] = val;
                    return update;
                }, e: (...val: ("a" | "b" | "c")[]) => {
                    conf["a.b.e"] = val.join(",");
                    return update;
                } } } };
    return update;
}
    `

    const value = ast.createConfig(obj)
    expect(output(value)).toBe(expected.trim())
  })

  test('createSource', () => {
    const obj = {
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

    // const value = ast.createSource(obj)
  })
})
