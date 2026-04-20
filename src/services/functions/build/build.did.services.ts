import {isNullish} from '@dfinity/utils';
import {type GenerateResultData} from '@junobuild/cli-tools';
import {generateDid as generateDidLib} from '@junobuild/functions-tools';
import {rm, writeFile} from 'node:fs/promises';
import {
  AUTO_GENERATED,
  EXTENSION_DID_FILE_NAME,
  SATELLITE_CUSTOM_DID_FILE,
  SATELLITE_DID_FILE
} from '../../../constants/build.constants';
import {readSatelliteDid} from '../../../utils/did.utils';

export const generateJsTsDid = async ({generatedData}: {generatedData: GenerateResultData}) => {
  const {generate} = generatedData;

  if (isNullish(generate)) {
    await rm(SATELLITE_CUSTOM_DID_FILE, {force: true});
    await rm(SATELLITE_DID_FILE, {force: true});
    return;
  }

  const {updates, queries} = generate;

  await generateDidLib({updates, queries, outputFile: SATELLITE_CUSTOM_DID_FILE});

  const templateDid = await readSatelliteDid();

  await writeFile(
    SATELLITE_DID_FILE,
    `${AUTO_GENERATED}\n\nimport service "${EXTENSION_DID_FILE_NAME}";\n\n${templateDid}`,
    'utf-8'
  );
};
