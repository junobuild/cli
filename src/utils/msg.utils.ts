import {red} from 'kleur';

export const consoleNoConfigFound = () => {
  console.log(
    `Oops! ${red('No config file found.')} Try to run the command from your project root.`
  );
};
