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
    const value = ast.createSetterFunc('a', 'b', 'cool')

    const expected = `
(val: any) => {
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
      builtin: {
        features: {
          name: 'builtin.features',
          description:
            'Indicates the builtin features for this build of librdkafka. An application can either query this value or attempt to set it with its list of required features to check for library support.',
          defaultValue: 'gzip, snappy, ssl, sasl, regex, lz4, sasl_gssapi, sasl_plain, sasl_scram, plugins',
          type: 'string',
        },
      },
    }

    const expected = `
config = (conf: {
    [key: string]: any;
}) => {
    const update = { builtin: { features: (val: any) => {
                conf["builtin.features"] = val;
                return update;
            } } };
    return update;
}    
    `

    const value = ast.createConfig(obj)
    expect(output(value)).toBe(expected.trim())
  })

  test('createSource', () => {
    const obj = {
      builtin: {
        features: {
          name: 'builtin.features',
          description:
            'Indicates the builtin features for this build of librdkafka. An application can either query this value or attempt to set it with its list of required features to check for library support.',
          defaultValue: 'gzip, snappy, ssl, sasl, regex, lz4, sasl_gssapi, sasl_plain, sasl_scram, plugins',
          type: 'string',
        },
      },
    }

    // const value = ast.createSource(obj)
  })
})
