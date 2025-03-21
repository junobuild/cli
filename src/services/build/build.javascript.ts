import {buildEsm} from '@junobuild/cli-tools';
import {green, red, yellow} from 'kleur';
import {join} from 'node:path';

export const buildTypeScript = async () => {
  const infile = join(process.cwd(), 'src/tests/fixtures/test_sputnik/resources/index.ts');
  const dist = join(process.cwd(), 'target', 'fixtures');
  const outfile = join(dist, 'index.mjs');

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

  console.log(`✅ Build complete (esbuild ${green(`v${version}`)}).`);
  console.log(
    `➡️  ${key} (${formatter.format(bytes / (unit === 'megabyte' ? 1_000_000 : 1_000))})`
  );
};
