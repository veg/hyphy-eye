import typescript from '@rollup/plugin-typescript';
import { dts } from "rollup-plugin-dts";
import copy from 'rollup-plugin-copy';

const config = [
  {
    input: 'src/index.js',
    output: {
      file: 'dist/hyphy-eye.js',
      format: 'es',
      sourcemap: true,
    },
    external: [
      'lodash-es',
      'd3',
      'phylotree',
      '@observablehq/plot',
      '@observablehq/stdlib',
      'parse-svg-path',
      'htl',
      'gamma'
    ]
  },
  {
    input: 'src/index.d.ts',
    output: {
      file: 'dist/hyphy-eye.d.ts',
      format: 'es',
    },
    plugins: [dts()]
  },
  {
    input: 'src/registry.ts',
    output: {
      file: 'dist/registry.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      typescript(),
      copy({
        targets: [{
          src: 'src/glyphs/**',
          dest: 'dist/glyphs'
        }]
      })
    ]
  },
  {
    input: 'src/registry.ts',
    output: {
      file: 'dist/registry.d.ts',
      format: 'es'
    },
    plugins: [dts()]
  }];

export default config;
