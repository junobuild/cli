import {yellow} from 'kleur';
import {existsSync} from 'node:fs';
import {copyFile as fsCopyFile} from 'node:fs/promises';
import {dirname, join, relative} from 'node:path';
import {fileURLToPath} from 'url';
import {confirm} from './prompt.utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const copyTemplateFile = async ({
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

  await fsCopyFile(join(__dirname, sourceFolder, template), destination);
};
