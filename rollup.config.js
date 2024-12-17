import { dts } from "rollup-plugin-dts";

const config = [
  {
    input: 'src/index.js',
    output: {
      file: 'dist/hyphy-vision-components.js',
      format: 'es',
      sourcemap: true,
    },
	  external: ['lodash-es', 'd3', 'phylotree'],
  },
  {
    input: 'src/index.d.ts',
    output: {
      file: 'dist/hyphy-vision-components.d.ts',
      format: 'es',
    },
    plugins: [dts()]
  }];

export default config;
