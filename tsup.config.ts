import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'mcp/server': 'src/mcp/server.ts',
    index: 'src/index.ts',
  },
  format: ['esm'],
  target: 'node18',
  platform: 'node',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  dts: true,
  splitting: false,
  treeshake: true,
  minify: false,
  shims: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
});
