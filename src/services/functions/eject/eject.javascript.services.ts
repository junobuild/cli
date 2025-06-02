import {execute} from '@junobuild/cli-tools';
import {magenta} from 'kleur';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {
  DEVELOPER_PROJECT_SATELLITE_PATH,
  INDEX_MJS,
  INDEX_TS,
  MJS_TEMPLATE_PATH,
  TS_TEMPLATE_PATH
} from '../../../constants/dev.constants';
import {copyTemplateFile} from '../../../utils/fs.utils';
import {readPackageJson} from '../../../utils/pkg.utils';
import {detectPackageManager} from '../../../utils/pm.utils';
import {confirmAndExit} from '../../../utils/prompt.utils';

export const ejectTypeScript = async () => {
  await eject({lang: 'ts'});
};

export const ejectJavaScript = async () => {
  await eject({lang: 'mjs'});
};

const eject = async ({lang}: {lang: 'ts' | 'mjs'}) => {
  await installFunctionsLib();

  await createTargetDir();

  await copyTemplateIndex({lang});

  if (lang === 'ts') {
    await copyTemplateTsConfig();
  }
};

const copyTemplateIndex = async ({lang}: {lang: 'ts' | 'mjs'}) => {
  await copyTemplateFile({
    template: lang === 'mjs' ? INDEX_MJS : INDEX_TS,
    sourceFolder: lang === 'mjs' ? MJS_TEMPLATE_PATH : TS_TEMPLATE_PATH,
    destinationFolder: DEVELOPER_PROJECT_SATELLITE_PATH
  });
};

const copyTemplateTsConfig = async () => {
  await copyTemplateFile({
    template: 'tsconfig.json',
    sourceFolder: TS_TEMPLATE_PATH,
    destinationFolder: DEVELOPER_PROJECT_SATELLITE_PATH
  });
};

const createTargetDir = async () => {
  const devProjectSrcPath = join(DEVELOPER_PROJECT_SATELLITE_PATH);
  await mkdir(devProjectSrcPath, {recursive: true});
};

const installFunctionsLib = async () => {
  const functionsAlreadyInstalled = await hasFunctionsLib();

  if (functionsAlreadyInstalled) {
    return;
  }

  await confirmAndExit(
    `The ${magenta(
      '@junobuild/functions'
    )} library is required to develop serverless functions. Install it now?`
  );

  const pm = detectPackageManager();

  await execute({
    command: pm ?? 'npm',
    args: [pm === 'npm' ? 'i' : 'add', '@junobuild/functions']
  });
};

const hasFunctionsLib = async (): Promise<boolean> => {
  try {
    const {dependencies} = await readPackageJson();
    return Object.keys(dependencies ?? {}).includes('@junobuild/functions');
  } catch (_err: unknown) {
    // This should not block the developer therefore we fallback to asking for installing the library.
    return false;
  }
};
