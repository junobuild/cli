import {buildEsm} from '@junobuild/cli-tools';
import {red, yellow} from 'kleur';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {
  DEPLOY_LOCAL_REPLICA_PATH,
  DEVELOPER_PROJECT_SATELLITE_PATH
} from '../../constants/dev.constants';

export const buildTypeScript = async ({path}: {path?: string | undefined} = {}) => {
  await build({lang: 'ts', path});
};

export const buildJavaScript = async ({path}: {path?: string | undefined} = {}) => {
  await build({lang: 'js', path});
};

const build = async ({lang, path}: {lang: 'ts' | 'js'; path?: string | undefined}) => {
  // Create output target/deploy if it does not yet exist.
  await mkdir(DEPLOY_LOCAL_REPLICA_PATH, {recursive: true});

  const infile =
    path ?? join(DEVELOPER_PROJECT_SATELLITE_PATH, lang === 'js' ? 'index.mjs' : 'index.ts');

  const outfile = join(DEPLOY_LOCAL_REPLICA_PATH, 'index.mjs');

  const {metafile, errors, warnings, version} = await buildEsm({
    infile,
    outfile
  });

  for (const {text} of warnings) {
    console.log(`${yellow('[Warn]')} ${text}`);
  }

  for (const {text} of errors) {
    console.log(`${red('[Error]')} ${text}`);
  }

  if (errors.length > 0) {
    process.exit(1);
  }

  const entry = Object.entries(metafile.outputs);

  if (entry.length === 0) {
    console.log(red('Unexpected: No metafile resulting from the build was found.'));
    process.exit(1);
  }

  const [key, {bytes}] = entry[0];

  const unit = bytes >= 1000 ? 'megabyte' : 'kilobyte';

  const formatter = new Intl.NumberFormat('en', {
    style: 'unit',
    unit
  });

  console.log(`✅ Build complete (esbuild ${version}).`);
  console.log(
    `➡️  ${key} (${formatter.format(bytes / (unit === 'megabyte' ? 1_000_000 : 1_000))})`
  );
};
