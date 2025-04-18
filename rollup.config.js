import { dts } from "rollup-plugin-dts";

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
  }];

export default config;
