import {red} from 'kleur';

export const consoleNoConfigFound = () => {
  console.log(`Oops! ${red('No juno.json found.')} Try to run the command from your project root.`);
};
