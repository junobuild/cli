import {copyFile, mkdir} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import ora from 'ora';
import {fileURLToPath} from 'url';
import {checkRustVersion} from '../utils/env.utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const eject = async () => {
  const {valid} = await checkRustVersion();

  if (!valid) {
    return;
  }

  const spinner = ora(`Ejecting satellite...`).start();

  try {
    await copyFile(
      join(__dirname, '../templates/eject/Cargo.toml'),
      join(process.cwd(), './Cargo.toml')
    );

    await mkdir(join(process.cwd(), './src/satellite/src'), {recursive: true});

    await copyFile(
      join(__dirname, '../templates/eject/src/satellite/Cargo.toml'),
      join(process.cwd(), './src/satellite/Cargo.toml')
    );
    await copyFile(
      join(__dirname, '../templates/eject/src/satellite/src/lib.rs'),
      join(process.cwd(), './src/satellite/src/lib.rs')
    );
  } finally {
    spinner.stop();
  }
};
