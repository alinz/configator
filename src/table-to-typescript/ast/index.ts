import * as ts from 'typescript'

import { removeQuotes } from '~/src/pkg/strings'

import { ConfigItemType, RangeValue, RangeNumber } from '../types'

// creates -> mapId['key'] = valId
export const createMapSetter = (mapId: string, key: string, valId: string) => {
  return ts.createExpressionStatement(
    ts.createBinary(
      ts.createElementAccess(ts.createIdentifier(mapId), ts.createStringLiteral(key)),
      ts.createToken(ts.SyntaxKind.FirstAssignment),
      ts.createIdentifier(valId),
    ),
  )
}

// creates -> return id
export const createReturnBlock = (id: string) => {
  return ts.createReturn(ts.createIdentifier(id))
}

// creates -> (val: any): Updater => { base['a.b.c'] = val; return parent; }
export const createSetterFunc = (mapId: string, key: string, returnId: string, type?: ConfigItemType, extra?: RangeValue | RangeNumber) => {
  let typeValue
  let dotDotDot
  let block = ts.createBlock([createMapSetter(mapId, key, 'val'), createReturnBlock(returnId)], true)

  switch (type) {
    case 'boolean':
      typeValue = ts.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword)
      break
    case 'number':
      typeValue = ts.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)
      break
    case 'function':
      typeValue = ts.createTypeReferenceNode(ts.createIdentifier('Function'), undefined)
      break
    case 'string':
      typeValue = ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
      break
    case 'range':
      switch (extra.type) {
        case 'number':
          typeValue = ts.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)
          break
        case 'single':
          typeValue = ts.createUnionTypeNode(extra.values.map((value) => ts.createLiteralTypeNode(ts.createStringLiteral(value))))
          break
        case 'multiple':
          typeValue = ts.createUnionTypeNode(extra.values.map((value) => ts.createLiteralTypeNode(ts.createStringLiteral(value))))

          break
      }
      break
    case 'multi':
      if (extra.type !== 'multiple') {
        throw new Error('failed to parse multiple')
      }

      typeValue = ts.createArrayTypeNode(
        ts.createParenthesizedType(ts.createUnionTypeNode(extra.values.map((value) => ts.createLiteralTypeNode(ts.createStringLiteral(value))))),
      )

      dotDotDot = ts.createToken(ts.SyntaxKind.DotDotDotToken)
      block = ts.createBlock(
        [
          ts.createExpressionStatement(
            ts.createBinary(
              ts.createElementAccess(ts.createIdentifier(mapId), ts.createStringLiteral(key)),
              ts.createToken(ts.SyntaxKind.FirstAssignment),
              ts.createCall(ts.createPropertyAccess(ts.createIdentifier('val'), ts.createIdentifier('join')), undefined, [
                ts.createStringLiteral(','),
              ]),
            ),
          ),
          ts.createReturn(ts.createIdentifier(returnId)),
        ],
        true,
      )
      break
  }

  return ts.createArrowFunction(
    undefined,
    undefined,
    [ts.createParameter(undefined, undefined, dotDotDot, ts.createIdentifier('val'), undefined, typeValue, undefined)],
    ts.createTypeReferenceNode(ts.createIdentifier('Updater'), undefined),
    ts.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
    block,
  )
}

// creates -> a = { "a.v": true, ... }
export const createFlatMap = (id: string, obj: any): ts.VariableDeclaration => {
  return ts.createVariableDeclaration(
    ts.createIdentifier(id),
    undefined,
    ts.createObjectLiteral(
      Object.keys(obj).map(
        (key: string): ts.ObjectLiteralElementLike => {
          const val = obj[key]

          if (val === null) {
            return ts.createPropertyAssignment(ts.createStringLiteral(key), ts.createNull())
          }

          switch (typeof val) {
            case 'number':
              return ts.createPropertyAssignment(ts.createStringLiteral(key), ts.createNumericLiteral(`${val}`))
            case 'string':
              return ts.createPropertyAssignment(ts.createStringLiteral(key), ts.createStringLiteral(val))
            case 'boolean':
              return ts.createPropertyAssignment(ts.createStringLiteral(key), val ? ts.createTrue() : ts.createFalse())
            case 'undefined':
              return ts.createPropertyAssignment(ts.createStringLiteral(key), ts.createIdentifier('undefined'))
            default:
              throw `key, '${key}:${val}' has an unsupported type`
          }
        },
      ),
      false,
    ),
  )
}

// creates -> export ....
export const createExport = (declaration: ts.VariableDeclaration) => {
  return ts.createVariableStatement(
    [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
    ts.createVariableDeclarationList([declaration], ts.NodeFlags.Const),
  )
}

export const isLeaf = (obj: any): boolean => {
  return 'property' in obj && 'type' in obj
}

export const createObjectUpdate = (obj: any, list: ts.ObjectLiteralElementLike[] = []): ts.ObjectLiteralElementLike[] => {
  Object.keys(obj).forEach((key: string) => {
    const val = obj[key]
    list.push(
      ts.createPropertyAssignment(
        ts.createIdentifier(key),
        isLeaf(val)
          ? createSetterFunc('conf', val.property, 'update', val.type, val.range)
          : ts.createObjectLiteral(createObjectUpdate(val, []), false),
      ),
    )
  })

  return list
}

/*
  creates ->

  export const config = (conf: { [key: string]: any }) => {
    const update = {}

    return update
  }
*/
export const createConfig = (obj: any) => {
  return ts.createVariableDeclaration(
    ts.createIdentifier('config'),
    undefined,
    ts.createArrowFunction(
      undefined,
      undefined,
      [
        ts.createParameter(
          undefined,
          undefined,
          undefined,
          ts.createIdentifier('conf'),
          undefined,
          ts.createTypeLiteralNode([
            ts.createIndexSignature(
              undefined,
              undefined,
              [
                ts.createParameter(
                  undefined,
                  undefined,
                  undefined,
                  ts.createIdentifier('key'),
                  undefined,
                  ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
                  undefined,
                ),
              ],
              ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
            ),
          ]),
          undefined,
        ),
      ],
      undefined,
      ts.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
      ts.createBlock(
        [
          ts.createVariableStatement(
            undefined,
            ts.createVariableDeclarationList(
              [ts.createVariableDeclaration(ts.createIdentifier('update'), undefined, ts.createObjectLiteral(createObjectUpdate(obj), false))],
              ts.NodeFlags.Const,
            ),
          ),
          ts.createReturn(ts.createIdentifier('update')),
        ],
        true,
      ),
    ),
  )
}

// creates -> (val: number) => Updater
export const createFuncType = (type: ConfigItemType, extra?: RangeValue | RangeNumber) => {
  let typeValue
  let dotDotDot

  switch (type) {
    case 'boolean':
      typeValue = ts.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword)
      break
    case 'number':
      typeValue = ts.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)
      break
    case 'function':
      typeValue = ts.createTypeReferenceNode(ts.createIdentifier('Function'), undefined)
      break
    case 'string':
      typeValue = ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
      break
    case 'range':
      switch (extra.type) {
        case 'number':
          typeValue = ts.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)
          break
        case 'single':
          typeValue = ts.createUnionTypeNode(extra.values.map((value) => ts.createLiteralTypeNode(ts.createStringLiteral(value))))
          break
        case 'multiple':
          typeValue = ts.createUnionTypeNode(extra.values.map((value) => ts.createLiteralTypeNode(ts.createStringLiteral(value))))

          break
      }
      break
    case 'multi':
      if (extra.type !== 'multiple') {
        throw new Error('failed to parse multiple')
      }

      typeValue = ts.createArrayTypeNode(
        ts.createParenthesizedType(ts.createUnionTypeNode(extra.values.map((value) => ts.createLiteralTypeNode(ts.createStringLiteral(value))))),
      )

      dotDotDot = ts.createToken(ts.SyntaxKind.DotDotDotToken)
      break
  }

  return ts.createFunctionTypeNode(
    undefined,
    [ts.createParameter(undefined, undefined, dotDotDot, ts.createIdentifier('val'), undefined, typeValue, undefined)],
    ts.createTypeReferenceNode(ts.createIdentifier('Updater'), undefined),
  )
}

const updaterInterfaceObj = (obj: any, list: ts.TypeElement[] = []): ts.TypeElement[] => {
  Object.keys(obj).forEach((key) => {
    const val = obj[key]
    list.push(
      isLeaf(val)
        ? ts.createPropertySignature(undefined, ts.createIdentifier(key), undefined, createFuncType(val.type, val.range), undefined)
        : ts.createPropertySignature(
            undefined,
            ts.createIdentifier(key),
            undefined,
            ts.createTypeLiteralNode(updaterInterfaceObj(val, [])),
            undefined,
          ),
    )
  })

  return list
}

export const createUpdaterInterface = (obj: any) => {
  return ts.createInterfaceDeclaration(
    undefined,
    [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
    ts.createIdentifier('Updater'),
    undefined,
    undefined,
    updaterInterfaceObj(obj),
  )
}

export const createSource = (obj: any, original: any) => {
  return ts.updateSourceFileNode(ts.createSourceFile('temporary.tsx', '', ts.ScriptTarget.Latest), [
    createUpdaterInterface(obj),
    createExport(createFlatMap('conf', original)),
    createExport(createConfig(obj)),
  ])
}

export const print = (source: ts.SourceFile): string => {
  return ts.createPrinter().printFile(source)
}

export const exec = (obj: any, original: any) => {
  return print(createSource(obj, original))
}
