import {cyan, green, magenta, yellow} from 'kleur';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {helpDevSubCommands} from '../commands/help';
import {checkRustVersion} from '../utils/env.utils';
import {copyTemplateFile} from '../utils/fs.utils';

const TEMPLATE_PATH = '../templates/eject';
const TEMPLATE_SATELLITE_PATH = join(TEMPLATE_PATH, 'src/satellite');
const DESTINATION_SATELLITE_PATH = './src/satellite';

export const eject = async () => {
  const {valid} = await checkRustVersion();

  if (valid === 'error') {
    console.error(`Cannot detect your Rust version. Is Cargo installed on your machine?`);
    return;
  }

  if (!valid) {
    return;
  }

  await copyTemplateFile({
    template: 'Cargo.toml',
    sourceFolder: TEMPLATE_PATH,
    destinationFolder: '.'
  });

  await mkdir(join(process.cwd(), './src/satellite/src'), {recursive: true});

  await copyTemplateFile({
    template: 'Cargo.toml',
    sourceFolder: TEMPLATE_SATELLITE_PATH,
    destinationFolder: DESTINATION_SATELLITE_PATH
  });

  await copyTemplateFile({
    template: 'lib.rs',
    sourceFolder: join(TEMPLATE_SATELLITE_PATH, 'src'),
    destinationFolder: join(DESTINATION_SATELLITE_PATH, 'src')
  });

  console.log(success({src: DESTINATION_SATELLITE_PATH}));
};

export const success = ({src}: {src: string}): string => `
✅ Satellite successfully ejected!

You can now extend your satellite's capabilities. Edit the generated Rust template located in ${yellow(
  `${src}`
)} and customize according to your needs.

Useful ${green('juno')} ${cyan('dev')} ${magenta('<subcommand>')} to continue with:

Sub-commands:
  ${helpDevSubCommands}
`;
