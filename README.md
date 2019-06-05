# Configator

`configator` is a command line tool built to deal with configuration. In a nut-shell, it reads Markdown table such as the following:

```
| Property | Type   | Range | Default | Description    |
|----------|--------|-------|---------|----------------|
| a.b.c    | range  | 1..10 | 5       | awesome value1 |
| a.b.d    | range  | a,b,c | b       | awesome value2 |
| a.b.e    | multi  | a,b,c | b,a     | awesome value3 |
```

and convert it into **chainable** and **statically typed** typescript like the following:

```ts
export const conf = { 'a.b.c': 5, 'a.b.d': 'b', 'a.b.e': 'b,a' }
export const config = (conf: { [key: string]: any }) => {
  const update = {
    a: {
      b: {
        c: (val: number) => {
          conf['a.b.c'] = val
          return update
        },
        d: (val: 'a' | 'b' | 'c') => {
          conf['a.b.d'] = val
          return update
        },
        e: (...val: ('a' | 'b' | 'c')[]) => {
          conf['a.b.e'] = val.join(',')
          return update
        },
      },
    },
  }
  return update
}
```

The chainable api helps navigate through deeply nested configuration, and statically typed definition prevents casual typo mistake.

# Usage

install as global using either `yarn` or `npm`

```
yarn install configator --global
```

compile `CONFIG.md` file and output as `config.ts`

```
configator -i ./docs/CONFIG.md -o ./src/config.ts --typescript
```

# Markdown Table Definition

At the moment, there are `boolean`,`number`,`function`,`string`,`range` and `multi` which are supported.


`range` is a specific type which handles `1..10` and `apple,orange,banana`.

`multi` is the same as `apple,orange,banana` but one or more item can be pass and set as `range` only one item can be set.


# Toolchain

`configator` comes with couple of toolchain. As far as Markdown table goes, editing that table is painful. for that reason, `configator` comes with `Markdown Table` to `CSV` file convertor. The `CSV` file can be open easily by any data sheet software and can be modified easily. Once the file is saved back to csv file, `configator` can convert back to `Markdown Table` file.


converts md file to csv

```
configator -i ./docs/CONFIG.md -o ./docs/CONFIG.csv --csv
```

convert csv back to md file

```
configator -i ./docs/CONFIG.csv -o ./docs/CONFIG.md --table
```
