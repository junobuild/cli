import {notEmptyString} from '@dfinity/utils';
import {assertAnswerCtrlC, nextArg} from '@junobuild/cli-tools';
import {cyan, green, magenta, red, yellow} from 'kleur';
import prompts from 'prompts';
import {DEVELOPER_PROJECT_SATELLITE_PATH} from '../../constants/dev.constants';
import {helpDevContinue} from '../../help/dev.help';
import {ejectJavaScript, ejectTypeScript} from './eject.javascript.services';
import {ejectRust} from './eject.rust.services';

type Lang = 'ts' | 'mjs' | 'rs';

export const eject = async (args?: string[]) => {
  const cmdLang = nextArg({args, option: '-l'}) ?? nextArg({args, option: '--lang'});

  if (notEmptyString(cmdLang)) {
    await ejectWithCmdLang({lang: cmdLang});
    return;
  }

  await promptLangAndEject();
};

const ejectWithCmdLang = async ({lang}: {lang: string | undefined}) => {
  // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
  switch (lang?.toLowerCase()) {
    case 'rs':
    case 'rust':
      await ejectRust();
      break;
    case 'ts':
    case 'typescript':
      await ejectTypeScript();
      break;
    case 'js':
    case 'javascript':
      unsupportedLang();
      return;
  }

  console.log(success());
};

const promptLangAndEject = async () => {
  const {lang} = await selectLang();

  switch (lang) {
    case 'rs':
      await ejectRust();
      break;
    case 'ts':
      await ejectTypeScript();
      break;
    case 'mjs':
      await ejectJavaScript();
      break;
  }

  console.log(success());
};

const unsupportedLang = () => {
  console.log(red('Unsupported language. No serverless function was generated.'));
  process.exit(1);
};

const selectLang = async (): Promise<{lang: Lang}> => {
  const {lang}: {lang: Lang} = await prompts({
    type: 'select',
    name: 'lang',
    message: 'What language do you want to use for your serverless function?',
    choices: [
      {title: 'Rust', value: 'rs'},
      {title: 'TypeScript', value: 'ts'},
      {title: 'JavaScript', value: 'mjs'}
    ],
    initial: 0
  });

  assertAnswerCtrlC(lang);

  return {lang};
};

export const success = (): string => `
🚀 Satellite successfully ejected!

The serverless function has been generated.
You can now start coding in: ${yellow(DEVELOPER_PROJECT_SATELLITE_PATH)}

Useful ${green('juno')} ${cyan('dev')} ${magenta('<subcommand>')} to continue with:

Subcommands:
  ${helpDevContinue}
`;
