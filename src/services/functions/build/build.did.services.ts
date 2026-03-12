import {isNullish} from '@dfinity/utils';
import {spawn} from '@junobuild/cli-tools';
import {existsSync} from 'node:fs';
import {readFile, rename, rm} from 'node:fs/promises';
import {join} from 'node:path';
import {
  EXTENSION_DID_FILE_NAME,
  SATELLITE_CUSTOM_DID_FILE
} from '../../../constants/build.constants';
import {DEVELOPER_PROJECT_SATELLITE_DECLARATIONS_PATH} from '../../../constants/dev.constants';
import {checkLocalIcpBindgen} from '../../../utils/build.bindgen.utils';
import {satellitedIdl} from '../../../utils/build.utils';
import {detectPackageManager} from '../../../utils/pm.utils';

export const generateDid = async () => {
  // No satellite_extension.did and therefore no services to generate to JS and TS.
  if (!existsSync(SATELLITE_CUSTOM_DID_FILE)) {
    return;
  }

  // We check if the developer has added any API endpoints. If none, we do not need to generate the bindings for JS and TS.
  const extensionDid = await readFile(SATELLITE_CUSTOM_DID_FILE, 'utf-8');
  const noAdditionalExtensionDid = 'service : { build_version : () -> (text) query }';

  if (extensionDid.trim() === noAdditionalExtensionDid) {
    return;
  }

  await executeIcpBindgen();

  // icp-bindgen generates the files in a `declarations` subfolder
  // using a different suffix for JavaScript as the one we used to use.
  // That's why we have to post-process the results.
  const generatedFolder = join(DEVELOPER_PROJECT_SATELLITE_DECLARATIONS_PATH, 'declarations');

  await rename(join(generatedFolder, `${EXTENSION_DID_FILE_NAME}.d.ts`), satellitedIdl('ts'));
  await rename(join(generatedFolder, `${EXTENSION_DID_FILE_NAME}.js`), satellitedIdl('js'));

  await rm(generatedFolder, {recursive: true, force: true});
};

const executeIcpBindgen = async () => {
  const pm = detectPackageManager();

  // The assertion on checkIcpBindgen() which requires the installation of icp-bindgen
  // is performed earlier to reaching this point. Therefore, we can optimistically
  // assume that if no tool is available locally, it should be available globally.
  const {valid: localValid} = await checkLocalIcpBindgen({pm});
  const withGlobalCmd = localValid !== true;

  const localCommand = pm === 'npm' || isNullish(pm) ? 'npx' : pm;

  // --actor-disabled: skip generating actor files, since we handle those ourselves
  // --force: overwrite files. Required; otherwise, icp-bindgen would delete files at preprocess,
  // which causes issues when multiple .did files are located in the same folder.
  await spawn({
    command: withGlobalCmd ? 'icp-bindgen' : localCommand,
    args: [
      ...(withGlobalCmd ? [] : ['icp-bindgen']),
      '--did-file',
      SATELLITE_CUSTOM_DID_FILE,
      '--out-dir',
      DEVELOPER_PROJECT_SATELLITE_DECLARATIONS_PATH,
      '--actor-disabled',
      '--force'
    ],
    silentOut: true
  });
};
