import {isEmptyString} from '@dfinity/utils';
import {red, yellow} from 'kleur';
import {existsSync, lstatSync} from 'node:fs';
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

export const assertNonNullishValidFolder: (
  folder?: string
) => asserts folder is NonNullable<string> = (folder?: string): void => {
  if (isEmptyString(folder)) {
    console.log(
      `You did not provide a ${yellow('directory')} that contains metadata.json and chunks to upload.`
    );
    process.exit(1);
  }

  if (!existsSync(folder)) {
    console.log(`The directory ${yellow('directory')} does not exist.`);
    process.exit(1);
  }

  if (!lstatSync(folder).isDirectory()) {
    console.log(red(`${folder} is not a directory.`));
    process.exit(1);
  }
};
