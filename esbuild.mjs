import {config} from 'dotenv';
import esbuild from 'esbuild';
import {existsSync, mkdirSync, writeFileSync} from 'fs';
import {join} from 'path';

config({
  path: process.env.NODE_ENV === 'development' ? `.env.development` : `.env.production`
});

const define = Object.entries(process.env).reduce(
  (acc, [key, value]) => ({
    ...acc,
    [`process.env.${key}`]: JSON.stringify(value)
  }),
  {}
);

const dist = join(process.cwd(), 'dist');

if (!existsSync(dist)) {
  mkdirSync(dist);
}

const script = esbuild.buildSync({
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: true,
  platform: 'node',
  write: false,
  define
});

writeFileSync('dist/index.js', `#!/usr/bin/env node\n${script.outputFiles[0].text}`);
