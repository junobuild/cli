import {assertAnswerCtrlC} from '@junobuild/cli-tools';
import prompts from 'prompts';

export const askForPassword = async (): Promise<string> => {
  const {encryptionKey}: {encryptionKey: string} = await prompts([
    {
      type: 'password',
      name: 'encryptionKey',
      message: `What's your config password?`
    }
  ]);

  assertAnswerCtrlC(encryptionKey);

  return encryptionKey;
};
