import {assertAnswerCtrlC} from '@junobuild/cli-tools';
import prompts from 'prompts';

export const askForPassword = async (message = "What is your configuration password?"): Promise<string> => {
  const {encryptionKey}: {encryptionKey: string} = await prompts([
    {
      type: 'password',
      name: 'encryptionKey',
      message
    }
  ]);

  assertAnswerCtrlC(encryptionKey);

  return encryptionKey;
};
