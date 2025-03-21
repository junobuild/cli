import {config} from 'dotenv';
import esbuild from 'esbuild';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

config({
  path: process.env.NODE_ENV === 'development' ? `.env.development` : `.env.production`
});

export const PACKAGE_JSON = 'package.json';

const readPackageJson = () => {
  const packageJson = join(process.cwd(), PACKAGE_JSON);
  const json = readFileSync(packageJson, 'utf8');
  const {peerDependencies, devDependencies} = JSON.parse(json);
  return {
    peerDependencies: peerDependencies ?? {},
    devDependencies: devDependencies ?? devDependencies
  };
};

const {peerDependencies, devDependencies} = readPackageJson();

export const externalDependencies = [
  ...Object.keys(peerDependencies),
  ...Object.keys(devDependencies)
];

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

const script = await esbuild.build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.mjs',
  bundle: true,
  minify: true,
  format: 'esm',
  platform: 'node',
  write: false,
  banner: {
    js: "import { createRequire as topLevelCreateRequire } from 'module';\n const require = topLevelCreateRequire(import.meta.url);"
  },
  external: externalDependencies,
  define
});

writeFileSync('dist/index.js', `#!/usr/bin/env node\n${script.outputFiles[0].text}`);
