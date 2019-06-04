import * as ts from 'typescript'

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

// creates -> (val: any) => { base['a.b.c'] = val; return parent; }
export const createSetterFunc = (mapId: string, key: string, returnId: string) => {
  return ts.createArrowFunction(
    undefined,
    undefined,
    [
      ts.createParameter(
        undefined,
        undefined,
        undefined,
        ts.createIdentifier('val'),
        undefined,
        ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
        undefined,
      ),
    ],
    undefined,
    ts.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
    ts.createBlock([createMapSetter(mapId, key, 'val'), createReturnBlock(returnId)], true),
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
  return Object.keys(obj).length == 4 && 'name' in obj && 'description' in obj && 'defaultValue' in obj && 'type' in obj
}

export const createObjectUpdate = (
  obj: any,
  list: ts.ObjectLiteralElementLike[] = [],
): ts.ObjectLiteralElementLike[] => {
  Object.keys(obj).forEach((key: string) => {
    const val = obj[key]
    list.push(
      ts.createPropertyAssignment(
        ts.createIdentifier(key),
        isLeaf(val)
          ? createSetterFunc('conf', val.name, 'update')
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
              [
                ts.createVariableDeclaration(
                  ts.createIdentifier('update'),
                  undefined,
                  ts.createObjectLiteral(createObjectUpdate(obj), false),
                ),
              ],
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

export const createSource = (obj: any, original: any) => {
  return ts.updateSourceFileNode(ts.createSourceFile('temporary.tsx', '', ts.ScriptTarget.Latest), [
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
