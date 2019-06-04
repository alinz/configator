import typescript from 'rollup-plugin-typescript2'
import { sizeSnapshot } from 'rollup-plugin-size-snapshot'
import { terser } from 'rollup-plugin-terser'

const onwarn = (warning) => {
  // Skip certain warnings

  // should intercept ... but doesn't in some rollup versions
  if (warning.code === 'THIS_IS_UNDEFINED') {
    return
  }

  // console.warn everything else
  console.warn(warning.message)
}

const plugins = [typescript({}), sizeSnapshot()]
// const ignore = ['__tests__']

const config = [
  {
    input: './src/index.ts',
    output: { file: `dist/index.js`, format: 'cjs', esModule: false },
    plugins,
    external: ['string_decoder'],
    onwarn,
  },
  {
    input: './src/index.ts',
    output: { file: `dist/index.esm.js`, format: 'esm' },
    plugins,
    external: ['string_decoder'],
    onwarn,
  },
]

export default config
