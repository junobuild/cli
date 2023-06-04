import {red} from 'kleur';

export const consoleNoConfigFound = () =>
  console.log(`${red('Oops! No juno.json found.')} Try to run the command from your project root.`);
