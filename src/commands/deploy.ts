import {AssetKey, Assets, ENCODING_TYPE, listAssets, uploadBlob} from '@junobuild/core';
import {Blob} from 'buffer';
import crypto from 'crypto';
import {fileTypeFromFile, MimeType} from 'file-type';
import {FileExtension} from 'file-type/core';
import {lstatSync, readdirSync} from 'fs';
import {readFile} from 'fs/promises';
import {green, grey} from 'kleur';
import mime from 'mime-types';
import minimatch from 'minimatch';
import ora from 'ora';
import {basename, extname, join} from 'path';
import {COLLECTION_DAPP, DAPP_COLLECTION, SOURCE, UPLOAD_BATCH_SIZE} from '../constants/constants';
import {junoConfigExist, readSatelliteConfig} from '../utils/satellite.config.utils';
import {satelliteParameters} from '../utils/satellite.utils';
import {init} from './init';

type FileDetails = {
  file: string;
  // e.g. for index.js.gz -> index.js
  alternateFile?: string;
  encoding?: ENCODING_TYPE;
  mime?: MimeType;
};

export const deploy = async () => {
  if (!(await junoConfigExist())) {
    await init();
  }

  const {satelliteId, source = SOURCE, ignore = []} = await readSatelliteConfig();

  const sourceAbsolutePath = join(process.cwd(), source);

  const sourceFiles = await listFiles({sourceAbsolutePath, satelliteId, ignore});

  if (sourceFiles.length === 0) {
    console.log('No new files to upload.');
    return;
  }

  const satellite = satelliteParameters(satelliteId);

  const fileDetailsPath = (file: FileDetails): string => file.alternateFile ?? file.file;

  const upload = async (file: FileDetails): Promise<AssetKey> => {
    const filePath = fileDetailsPath(file);

    return uploadBlob({
      satellite,
      filename: basename(filePath),
      fullPath: fullPath({file: filePath, sourceAbsolutePath}),
      // @ts-ignore type incompatibility NodeJS vs bundle
      data: new Blob([await readFile(file.file)]),
      collection: COLLECTION_DAPP,
      headers: [
        ...(file.mime === undefined ? [] : ([['Content-Type', file.mime]] as [string, string][]))
      ],
      encoding: file.encoding
    });
  };

  // Execute upload UPLOAD_BATCH_SIZE files at a time max preventively to not stress too much the network
  for (let i = 0; i < sourceFiles.length; i += UPLOAD_BATCH_SIZE) {
    const files = sourceFiles.slice(i, i + UPLOAD_BATCH_SIZE);

    files.forEach((file) => console.log(`↗️  ${grey(fileDetailsPath(file))}`));

    const spinner = ora(`Uploading...`).start();

    try {
      const promises = files.map(upload);
      await Promise.all(promises);

      spinner.stop();

      files.forEach((file) => console.log(`✅ ${green(fileDetailsPath(file))}`));
    } catch (err: unknown) {
      spinner.stop();
      throw err;
    }
  }
};

const fullPath = ({file, sourceAbsolutePath}: {file: string; sourceAbsolutePath: string}): string =>
  file.replace(sourceAbsolutePath, '');

const files = (source: string): string[] => {
  return readdirSync(source).flatMap((file) => {
    const path = join(source, file);
    return lstatSync(path).isDirectory() ? files(path) : join(path);
  });
};

const filterFilesToUpload = async ({
  files,
  sourceAbsolutePath,
  satelliteId
}: {
  files: FileDetails[];
  sourceAbsolutePath: string;
  satelliteId: string;
}): Promise<FileDetails[]> => {
  const existingAssets = await listAssets({
    collection: DAPP_COLLECTION,
    satellite: satelliteParameters(satelliteId)
  });

  const promises = files.map((file: FileDetails) =>
    fileNeedUpload({file, sourceAbsolutePath, existingAssets})
  );
  const results: {file: FileDetails; upload: boolean}[] = await Promise.all(promises);

  return results.filter(({upload}) => upload).map(({file}) => file);
};

const computeSha256 = async (file: string): Promise<string> => {
  const buffer = await readFile(file);
  return crypto.createHash('sha256').update(buffer).digest('base64');
};

const fileNeedUpload = async ({
  file,
  existingAssets,
  sourceAbsolutePath
}: {
  file: FileDetails;
  existingAssets: Assets;
  sourceAbsolutePath: string;
}): Promise<{
  file: FileDetails;
  upload: boolean;
}> => {
  const effectiveFilePath = file.alternateFile ?? file.file;

  const asset = existingAssets.assets.find(
    ({fullPath: f}) => f === fullPath({file: effectiveFilePath, sourceAbsolutePath})
  );

  if (!asset) {
    return {file, upload: true};
  }

  const sha256 = await computeSha256(effectiveFilePath);

  // TODO: current sha256 comparison (NodeJS vs Rust) with Gzip and BR is inaccurate. Therefore we re-upload compressed files only if their corresponding source files have been modified as well.
  // return {file, upload: sha256 !== asset.encodings[file.encoding ?? 'identity']?.sha256};
  // TODO: we also always assume the raw encoding is there
  return {file, upload: sha256 !== asset.encodings['identity']?.sha256};
};

const listFiles = async ({
  sourceAbsolutePath,
  satelliteId,
  ignore
}: {
  sourceAbsolutePath: string;
  satelliteId: string;
  ignore: string[];
}): Promise<FileDetails[]> => {
  const sourceFiles = files(sourceAbsolutePath);

  const filteredSourceFiles = sourceFiles.filter(
    (file) => ignore.find((pattern) => minimatch(file, pattern)) === undefined
  );

  // TODO: brotli and zlib naive
  const mapEncodingType = ({
    file,
    ext
  }: {
    file: string;
    ext: FileExtension | undefined;
  }): ENCODING_TYPE | undefined => {
    if (ext === 'Z') {
      return 'compress';
    } else if (ext === 'gz') {
      return 'gzip';
    } else if (extname(file) === '.br') {
      return 'br';
    } else if (extname(file) === '.zlib') {
      return 'deflate';
    }

    return undefined;
  };

  const findAlternateFile = ({
    file,
    encodingType
  }: {
    file: string;
    encodingType: ENCODING_TYPE | undefined;
  }): string | undefined => {
    if (!encodingType) {
      return undefined;
    }

    return filteredSourceFiles.find((sourceFile) => sourceFile === file.replace(extname(file), ''));
  };

  const mapFiles = async (file: string): Promise<FileDetails> => {
    const fileType = await fileTypeFromFile(file);
    const encodingType = mapEncodingType({file, ext: fileType?.ext});

    // The mime-type that matters is the one of the requested file by the browser, not the mime type of the encoding
    const alternateFile = findAlternateFile({file, encodingType});

    // For some reason the library 'file-type' does not always map the mime type correctly
    const mimeType = mime.lookup(alternateFile ?? file);

    return {
      file,
      alternateFile,
      mime: typeof mimeType === 'string' ? (mimeType as MimeType) : undefined,
      encoding: encodingType
    };
  };

  const encodingFiles: FileDetails[] = await Promise.all(filteredSourceFiles.map(mapFiles));

  return filterFilesToUpload({
    files: encodingFiles,
    sourceAbsolutePath,
    satelliteId
  });
};
