import {minimatch} from 'minimatch';
import {lstatSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import type {SatelliteConfig} from '../types/satellite.config';

export const listSourceFiles = ({
  sourceAbsolutePath,
  ignore
}: {sourceAbsolutePath: string} & Required<Pick<SatelliteConfig, 'ignore'>>): string[] => {
  const sourceFiles = files(sourceAbsolutePath);

  const filteredEmptyFiles = sourceFiles.filter((file) => lstatSync(file).size > 0);

  const filteredSourceFiles = filteredEmptyFiles.filter(
    (file) => ignore.find((pattern) => minimatch(file, pattern)) === undefined
  );

  return filteredSourceFiles;
};

const files = (source: string): string[] =>
  readdirSync(source).flatMap((file) => {
    const path = join(source, file);
    return lstatSync(path).isDirectory() ? files(path) : join(path);
  });
