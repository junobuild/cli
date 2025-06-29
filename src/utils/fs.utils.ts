import {yellow} from 'kleur';
import {existsSync} from 'node:fs';
import {copyFile as fsCopyFile, readFile} from 'node:fs/promises';
import {dirname, join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {confirm} from './prompt.utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const copyTemplateFile = async ({
  sourceFolder,
  destinationFolder,
  destinationFilename,
  template,
  overwrite = false
}: {
  sourceFolder: string;
  destinationFolder: string;
  destinationFilename?: string;
  template: string;
  overwrite?: boolean;
}) => {
  const destination = destinationFilename ?? join(destinationFolder, template);

  if (!overwrite && existsSync(destination)) {
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

export const readTemplateFile = async ({
  sourceFolder,
  template
}: {
  sourceFolder: string;
  template: string;
}): Promise<string> => {
  return await readFile(join(__dirname, sourceFolder, template), 'utf-8');
};
