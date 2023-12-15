import {minimatch} from 'minimatch';
import {lstatSync, readdirSync} from 'node:fs';
import {basename, join} from 'node:path';
import {IGNORE_OS_FILES} from '../constants/constants';

import {SatelliteConfig} from '../types/juno.config';

export const listSourceFiles = ({
  sourceAbsolutePath,
  ignore
}: {sourceAbsolutePath: string} & Required<Pick<SatelliteConfig, 'ignore'>>): string[] => {
  const sourceFiles = files(sourceAbsolutePath);

  return sourceFiles.filter((file) => filterFile({file, ignore}));
};

const filterFile = ({
  file,
  ignore
}: {file: string} & Required<Pick<SatelliteConfig, 'ignore'>>): boolean => {
  // File must not be empty >= 0kb
  if (lstatSync(file).size <= 0) {
    return false;
  }

  // Ignore .DS_Store on Mac or Thumbs.db on Windows
  if (IGNORE_OS_FILES.includes(basename(file).toLowerCase())) {
    return false;
  }

  return ignore.find((pattern) => minimatch(file, pattern)) === undefined;
};

const files = (source: string): string[] =>
  readdirSync(source).flatMap((file) => {
    const path = join(source, file);
    return lstatSync(path).isDirectory() ? files(path) : join(path);
  });
