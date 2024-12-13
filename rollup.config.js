import typescript from '@rollup/plugin-typescript';
import dts from "rollup-plugin-dts";

const config = [
  {
    input: 'dist/index.js',
    output: {
      file: 'dist/hyphy-vision-components.js',
      format: 'es',
      sourcemap: true,
    },
	  external: ['lodash-es', 'd3', 'phylotree'],
    plugins: [typescript()]
  }, {
    input: 'dist/index.d.ts',
    output: {
      file: 'dist/hyphy-vision-components.d.ts',
      format: 'es'
    },
    plugins: [dts()]
  }
];

export default config;
