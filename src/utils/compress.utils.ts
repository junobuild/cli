import {minimatch} from 'minimatch';
import {createReadStream, createWriteStream} from 'node:fs';
import {createGzip} from 'node:zlib';
import {COMPRESS_FILES} from '../constants/constants';

export const compressFiles = async (sourceFiles: string[]): Promise<string[]> => {
  const filesToCompress = sourceFiles.filter((file) => minimatch(file, COMPRESS_FILES));
  return Promise.all(filesToCompress.map(gzipFile));
};

const gzipFile = (sourcePath: string) =>
  new Promise<string>((resolve, reject) => {
    const sourceStream = createReadStream(sourcePath);

    const destinationPath = `${sourcePath}.gz`;
    const destinationStream = createWriteStream(destinationPath);

    const gzip = createGzip();

    sourceStream.pipe(gzip).pipe(destinationStream);

    destinationStream.on('close', () => resolve(destinationPath));
    destinationStream.on('error', reject);
  });
