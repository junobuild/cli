import {yellow} from 'kleur';
import {existsSync} from 'node:fs';
import {copyFile, mkdir} from 'node:fs/promises';
import {dirname, join, relative} from 'node:path';
import {fileURLToPath} from 'url';
import {checkRustVersion} from '../utils/env.utils';
import {confirm} from '../utils/prompt.utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEMPLATE_PATH = '../templates/eject';
const TEMPLATE_SATELLITE_PATH = join(TEMPLATE_PATH, 'src/satellite');
const DESTINATION_SATELLITE_PATH = './src/satellite';

export const eject = async () => {
  const {valid} = await checkRustVersion();

  if (!valid) {
    return;
  }

  await writeFile({
    template: 'Cargo.toml',
    sourceFolder: TEMPLATE_PATH,
    destinationFolder: '.'
  });

  await mkdir(join(process.cwd(), './src/satellite/src'), {recursive: true});

  await writeFile({
    template: 'Cargo.toml',
    sourceFolder: TEMPLATE_SATELLITE_PATH,
    destinationFolder: DESTINATION_SATELLITE_PATH
  });

  await writeFile({
    template: 'lib.rs',
    sourceFolder: join(TEMPLATE_SATELLITE_PATH, 'src'),
    destinationFolder: join(DESTINATION_SATELLITE_PATH, 'src')
  });
};

const writeFile = async ({
  sourceFolder,
  destinationFolder,
  template
}: {
  sourceFolder: string;
  destinationFolder: string;
  template: string;
}) => {
  const destination = join(process.cwd(), destinationFolder, template);

  if (existsSync(destination)) {
    const answer = await confirm(
      `File ${yellow(
        relative(process.cwd(), destination)
      )} already exists. Do you want to overwrite it?`
    );

    if (!answer) {
      return;
    }
  }

  await copyFile(join(__dirname, sourceFolder, template), destination);
};
