import {assertAnswerCtrlC} from '@junobuild/cli-tools';
import {cyan, green, magenta, red, yellow} from 'kleur';
import prompts from 'prompts';
import {DEVELOPER_PROJECT_SATELLITE_PATH} from '../../constants/dev.constants';
import {helpDevContinue} from '../../help/dev.help';
import {ejectJavaScript, ejectTypeScript} from './eject.javascript.services';
import {ejectRust} from './eject.rust.services';

type Lang = 'ts' | 'mjs' | 'rs';

export const eject = async () => {
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
    default:
      console.log(red('Unsupported language. No serverless function was generated.'));
      process.exit(1);
  }

  console.log(success({src: DEVELOPER_PROJECT_SATELLITE_PATH}));
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

export const success = ({src}: {src: string}): string => `
🚀 Satellite successfully ejected!

Your serverless function has been generated.
You can now start coding in: ${yellow(src)}

Useful ${green('juno')} ${cyan('dev')} ${magenta('<subcommand>')} to continue with:

Subcommands:
  ${helpDevContinue}
`;
