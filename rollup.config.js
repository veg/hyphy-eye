const config = [
  {
    input: 'src/index.js',
    output: {
      file: 'dist/hyphy-vision-components.js',
      format: 'es',
      sourcemap: true,
    },
	  external: ['lodash-es', 'd3', 'phylotree'],
  },];

export default config;
