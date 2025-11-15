import prompts from 'prompts';
import {DEV} from '../env';
import {isHeadless} from './process.utils';

export const NEW_CMD_LINE = '\n  ';

interface PromptState {
  aborted: boolean;
}

const enableTerminalCursor = () => {
  process.stdout.write('\x1B[?25h');
};

const onState = (state: PromptState) => {
  if (state.aborted) {
    // If we don't re-enable the terminal cursor before exiting
    // the program, the cursor will remain hidden
    enableTerminalCursor();
    process.stdout.write('\n');
    process.exit(1);
  }
};

// Source: https://github.com/terkelg/prompts/issues/252
export const promptConfirm = async (message: string): Promise<boolean> => {
  const {answer}: {answer: boolean} = await prompts([
    {
      type: 'toggle',
      name: 'answer',
      message,
      initial: false,
      active: 'yes',
      inactive: 'no',
      onState
    }
  ]);

  return answer;
};

export const confirm = async (message: string): Promise<boolean> => await promptConfirm(message);

export const confirmAndExit = async (message: string) => {
  const answer = await confirm(message);

  if (!answer) {
    process.exit(1);
  }
};

export const confirmAndExitUnlessHeadlessAndDev = async (message: string) => {
  if (isHeadless() && DEV) {
    return;
  }

  await confirmAndExit(message);
};
