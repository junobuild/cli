import {isNullish} from '@dfinity/utils';
import type {GenerateResultData} from '@junobuild/cli-tools';
import {
  generateIdlApi as generateIdlApiLib,
  generateZodApi as generateZodApiLib,
  type TransformerOptions
} from '@junobuild/functions-tools';
import {existsSync} from 'node:fs';
import {mkdir} from 'node:fs/promises';
import {detectJunoConfigType} from '../../../configs/juno.config';
import {DEVELOPER_PROJECT_SATELLITE_DECLARATIONS_PATH} from '../../../constants/dev.constants';
import type {BuildLang} from '../../../types/build';
import {satellitedIdl} from '../../../utils/build.utils';
import {readPackageJson} from '../../../utils/pkg.utils';

export const generateIdlApi = async () => {
  const inputFile = satellitedIdl('ts');

  if (!existsSync(inputFile)) {
    return;
  }

  const detectedConfig = detectJunoConfigType();
  const lang = detectedConfig?.configType === 'ts' ? 'ts' : 'mjs';

  const generateFn: GenerateFn = async (params) => {
    await generateIdlApiLib({inputFile, ...params});
  };

  await generateApi({generateFn, lang});
};

export const generateZodApi = async ({
  generatedData,
  lang
}: {
  generatedData: GenerateResultData;
  lang: Omit<BuildLang, 'rs'>;
}) => {
  const {generate} = generatedData;

  if (isNullish(generate)) {
    return;
  }

  const {updates, queries} = generate;
  const functions = [...queries, ...updates];

  const generateFn: GenerateFn = async (params) => {
    await generateZodApiLib({
      ...params,
      functions
    });
  };

  await generateApi({generateFn, lang});
};

type GenerateFn = (params: {
  outputFile: string;
  transformerOptions: TransformerOptions;
}) => Promise<void>;

const generateApi = async ({
  generateFn,
  lang
}: {
  generateFn: GenerateFn;
  lang: Omit<BuildLang, 'rs'>;
}) => {
  const readCoreLib = async (): Promise<'core' | 'core-standalone'> => {
    try {
      const {dependencies} = await readPackageJson();
      return Object.keys(dependencies ?? {}).includes('@junobuild/core-standalone')
        ? 'core-standalone'
        : 'core';
    } catch (_err: unknown) {
      // This should not block the developer therefore we fallback to core which is the common way of using the library
      return 'core';
    }
  };

  const coreLib = await readCoreLib();

  // In TypeScript, unlike for Rust, the declarations folder might not exist yet when the functions
  // are parsed for the first time
  await mkdir(DEVELOPER_PROJECT_SATELLITE_DECLARATIONS_PATH, {recursive: true});

  const outputLanguage = lang === 'mjs' ? 'js' : 'ts';

  const outputFile = `${DEVELOPER_PROJECT_SATELLITE_DECLARATIONS_PATH}/satellite.api.${outputLanguage}`;

  await generateFn({
    outputFile,
    transformerOptions: {
      outputLanguage,
      coreLib
    }
  });
};
