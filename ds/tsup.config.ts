import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: false,
  sourcemap: false,
  treeshake: true,
  // react/react-dom stay external (host provides them); lucide icons are bundled
  // so the design-system bundle is self-contained.
  noExternal: [/lucide-react/],
  external: ['react', 'react-dom', 'react/jsx-runtime'],
});
