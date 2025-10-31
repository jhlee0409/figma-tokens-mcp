import { defineConfig } from 'tsup';

export default defineConfig([
  // Server entry with shebang
  {
    entry: {
      'mcp/server': 'src/mcp/server.ts',
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
  },
  // Index entry without shebang
  {
    entry: {
      index: 'src/index.ts',
    },
    format: ['esm'],
    target: 'node18',
    platform: 'node',
    outDir: 'dist',
    clean: false, // Don't clean since server already built
    sourcemap: true,
    dts: true,
    splitting: false,
    treeshake: true,
    minify: false,
    shims: true,
  },
]);
