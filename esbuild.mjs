import {config} from 'dotenv';
import esbuild from 'esbuild';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, extname, join} from 'node:path';

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

// Source workaround: https://github.com/evanw/esbuild/issues/859
const nodeModulesOpen = /\/node_modules\/typescript\//;

const dirnamePlugin = {
  name: 'dirname',
  setup(build) {
    build.onLoad({filter: /.*/}, ({path: filePath}) => {
      if (filePath.match(nodeModulesOpen)) {
        const contents = readFileSync(filePath, 'utf8');
        const loader = extname(filePath).substring(1);
        const _dirname = dirname(filePath);

        return {
          contents: contents
            .replaceAll('__dirname', `"${_dirname}"`)
            .replaceAll('__filename', `"${filePath}"`),
          loader
        };
      }
    });
  }
};

const script = await esbuild.build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.mjs',
  bundle: true,
  minify: false,
  format: 'esm',
  platform: 'node',
  write: false,
  banner: {
    js: "import { createRequire as topLevelCreateRequire } from 'module';\n const require = topLevelCreateRequire(import.meta.url);"
  },
  define,
  plugins: [dirnamePlugin]
});

writeFileSync('dist/index.js', `#!/usr/bin/env node\n${script.outputFiles[0].text}`);
