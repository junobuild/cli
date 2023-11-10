import {minimatch} from 'minimatch';
import {createReadStream, createWriteStream} from 'node:fs';
import {createGzip} from 'node:zlib';
import {DEPLOY_DEFAULT_GZIP} from '../constants/deploy.constants';
import type {SatelliteConfig} from '../types/satellite.config';

export const gzipFiles = async ({
  sourceFiles,
  gzip
}: {sourceFiles: string[]} & Required<Pick<SatelliteConfig, 'gzip'>>): Promise<string[]> => {
  if (gzip === false) {
    return [];
  }

  // @ts-expect-error we read json so, it's possible that one provide a boolean that does not match the TS type
  const pattern = gzip === true ? DEPLOY_DEFAULT_GZIP : gzip;

  const filesToCompress = sourceFiles.filter((file) => minimatch(file, pattern));
  return await Promise.all(filesToCompress.map(gzipFile));
};

const gzipFile = async (sourcePath: string) =>
  await new Promise<string>((resolve, reject) => {
    const sourceStream = createReadStream(sourcePath);

    const destinationPath = `${sourcePath}.gz`;
    const destinationStream = createWriteStream(destinationPath);

    const gzip = createGzip();

    sourceStream.pipe(gzip).pipe(destinationStream);

    destinationStream.on('close', () => {
      resolve(destinationPath);
    });
    destinationStream.on('error', reject);
  });
