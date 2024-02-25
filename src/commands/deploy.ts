import type {SatelliteConfig} from '@junobuild/config';
import {uploadBlob, type Asset, type AssetKey, type ENCODING_TYPE} from '@junobuild/core-peer';
import {isNullish, nonNullish} from '@junobuild/utils';
import {Blob} from 'buffer';
import crypto from 'crypto';
import {fileTypeFromFile, type MimeType} from 'file-type';
import {type FileExtension} from 'file-type/core';
import {red} from 'kleur';
import Listr from 'listr';
import mime from 'mime-types';
import {minimatch} from 'minimatch';
import {lstatSync} from 'node:fs';
import {readFile} from 'node:fs/promises';
import {basename, extname, join, relative} from 'node:path';
import {junoConfigExist, readJunoConfig} from '../configs/juno.config';
import {COLLECTION_DAPP, UPLOAD_BATCH_SIZE} from '../constants/constants';
import {
  DEPLOY_DEFAULT_ENCODING,
  DEPLOY_DEFAULT_GZIP,
  DEPLOY_DEFAULT_IGNORE,
  DEPLOY_DEFAULT_SOURCE
} from '../constants/deploy.constants';
import {clear} from '../services/clear.services';
import {assertSatelliteMemorySize, listAssets} from '../services/deploy.services';
import {links} from '../services/links.services';
import type {SatelliteConfigEnv} from '../types/config';
import {hasArgs} from '../utils/args.utils';
import {gzipFiles} from '../utils/compress.utils';
import {configEnv} from '../utils/config.utils';
import {listSourceFiles} from '../utils/deploy.utils';
import {satelliteParameters} from '../utils/satellite.utils';
import {init} from './init';

interface FileDetails {
  file: string;
  // e.g. for index.js.gz -> index.js
  alternateFile?: string;
  encoding?: ENCODING_TYPE;
  mime?: MimeType;
}

export const deploy = async (args?: string[]) => {
  if (!(await junoConfigExist())) {
    await init();
  }

  if (hasArgs({args, options: ['-c', '--clear']})) {
    await clear(args);
  }

  await executeDeploy(args);

  await links(args);
};

const executeDeploy = async (args?: string[]) => {
  const env = configEnv(args);
  const {satellite: satelliteConfig} = await readJunoConfig(env);

  const {
    source = DEPLOY_DEFAULT_SOURCE,
    ignore = DEPLOY_DEFAULT_IGNORE,
    encoding = DEPLOY_DEFAULT_ENCODING,
    gzip = DEPLOY_DEFAULT_GZIP
  } = satelliteConfig;

  const sourceAbsolutePath = join(process.cwd(), source);

  const sourceFiles = await listFiles({
    sourceAbsolutePath,
    ignore,
    encoding,
    gzip,
    satellite: satelliteConfig,
    env
  });

  if (sourceFiles.length === 0) {
    console.log('No new files to upload.');
    return;
  }

  await assertSatelliteMemorySize(args);

  const satellite = satelliteParameters({satellite: satelliteConfig, env});

  const fileDetailsPath = (file: FileDetails): string => file.alternateFile ?? file.file;

  const upload = async (file: FileDetails): Promise<AssetKey> => {
    const filePath = fileDetailsPath(file);

    return await uploadBlob({
      satellite,
      filename: basename(filePath),
      fullPath: fullPath({file: filePath, sourceAbsolutePath}),
      // @ts-expect-error type incompatibility NodeJS vs bundle
      data: new Blob([await readFile(file.file)]),
      collection: COLLECTION_DAPP,
      headers: [
        ...(file.mime === undefined
          ? []
          : ([['Content-Type', file.mime]] as Array<[string, string]>))
      ],
      encoding: file.encoding
    });
  };

  const uploadFiles = async (groupFiles: FileDetails[]) => {
    // Execute upload UPLOAD_BATCH_SIZE files at a time max preventively to not stress too much the network
    for (let i = 0; i < groupFiles.length; i += UPLOAD_BATCH_SIZE) {
      const files = groupFiles.slice(i, i + UPLOAD_BATCH_SIZE);

      const tasks = new Listr<AssetKey>(
        files.map((file) => ({
          title: `Uploading ${relative(sourceAbsolutePath, file.file)}`,
          task: async () => await upload(file)
        })),
        {concurrent: true}
      );

      await tasks.run();
    }
  };

  // TODO: temporary possible race condition fix until Satellite v0.0.13 is published
  // We must upload the alternative path first to ensure . Friday Oct. 10 2023 I got unexpected race condition while uploading the Astro sample example (file hoisted.8961d9b1.js).
  await uploadFiles(sourceFiles.filter(({alternateFile}) => nonNullish(alternateFile)));
  await uploadFiles(sourceFiles.filter(({alternateFile}) => isNullish(alternateFile)));

  console.log(`\n🚀 Deploy complete!`);
};

const fullPath = ({file, sourceAbsolutePath}: {file: string; sourceAbsolutePath: string}): string =>
  file.replace(sourceAbsolutePath, '').replace(/\\/g, '/');

const assertSourceDirExists = (source: string) => {
  try {
    lstatSync(source);
  } catch (err: unknown) {
    console.log(
      `${red(
        'Cannot proceed deployment.'
      )}\nAre you sure the folder containing your built app (the "source" tag in the configuration file for Juno) files is correctly configured, or have you built your app?`
    );
    process.exit(1);
  }
};

const filterFilesToUpload = async ({
  files,
  sourceAbsolutePath,
  ...env
}: {
  files: FileDetails[];
  sourceAbsolutePath: string;
} & SatelliteConfigEnv): Promise<FileDetails[]> => {
  const existingAssets = await listAssets({env});

  const promises = files.map(
    async (file: FileDetails) => await fileNeedUpload({file, sourceAbsolutePath, existingAssets})
  );
  const results: Array<{file: FileDetails; upload: boolean}> = await Promise.all(promises);

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
  existingAssets: Asset[];
  sourceAbsolutePath: string;
}): Promise<{
  file: FileDetails;
  upload: boolean;
}> => {
  const effectiveFilePath = file.alternateFile ?? file.file;

  const asset = existingAssets.find(
    ({fullPath: f}) => f === fullPath({file: effectiveFilePath, sourceAbsolutePath})
  );

  if (isNullish(asset)) {
    return {file, upload: true};
  }

  const sha256 = await computeSha256(effectiveFilePath);

  // TODO: current sha256 comparison (NodeJS vs Rust) with Gzip and BR is inaccurate. Therefore we re-upload compressed files only if their corresponding source files have been modified as well.
  // return {file, upload: sha256 !== asset.encodings[file.encoding ?? 'identity']?.sha256};
  // TODO: we also always assume the raw encoding is there
  return {file, upload: sha256 !== asset.encodings.identity?.sha256};
};

const listFiles = async ({
  sourceAbsolutePath,
  ignore,
  encoding,
  gzip,
  ...env
}: {
  sourceAbsolutePath: string;
} & SatelliteConfigEnv &
  Required<Pick<SatelliteConfig, 'ignore' | 'encoding' | 'gzip'>>): Promise<FileDetails[]> => {
  assertSourceDirExists(sourceAbsolutePath);

  const sourceFiles = listSourceFiles({sourceAbsolutePath, ignore});
  const compressedFiles = await gzipFiles({sourceFiles, gzip});

  const files = [...sourceFiles, ...compressedFiles.filter((file) => !sourceFiles.includes(file))];

  // TODO: brotli and zlib naive
  const mapEncodingType = ({
    file,
    ext
  }: {
    file: string;
    ext: FileExtension | undefined;
  }): ENCODING_TYPE | undefined => {
    const customEncoding = encoding.find(([pattern, _]) => minimatch(file, pattern));

    if (nonNullish(customEncoding)) {
      const [_, encodingType] = customEncoding;
      return encodingType;
    }

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
    if (isNullish(encodingType)) {
      return undefined;
    }

    return files.find((sourceFile) => sourceFile === file.replace(extname(file), ''));
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

  const encodingFiles: FileDetails[] = await Promise.all(files.map(mapFiles));

  return await filterFilesToUpload({
    files: encodingFiles,
    sourceAbsolutePath,
    ...env
  });
};
