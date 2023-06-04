import {red} from 'kleur';

export const consoleNoConfigFound = () =>
  console.log(`${red('Oops! No juno.json found.')} Run command from your project root.`);
