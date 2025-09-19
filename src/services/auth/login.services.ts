import type {JsonnableEd25519KeyIdentity} from '@dfinity/identity';
import {nextArg} from '@junobuild/cli-tools';
import {bold, green, underline} from 'kleur';
import {randomBytes} from 'node:crypto';
import fs from 'node:fs';
import type http from 'node:http';
import {createServer} from 'node:http';
import path, {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import util from 'node:util';
import {saveCliConfig} from '../../configs/cli.config';
import {authUrl, generateToken, requestUrl} from '../../utils/auth.utils';
import {openUrl} from '../../utils/open.utils';
import {getPort} from '../../utils/port.utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const login = async (args?: string[]) => {
  const port = await getPort();
  const nonce = randomBytes(16).toString('hex');

  const {principal, token} = generateToken();

  console.log(`\n🔓 Your terminal will authenticate with admin access as: ${green(principal)}`);

  const browser = nextArg({args, option: '-b'}) ?? nextArg({args, option: '--browser'});

  // eslint-disable-next-line promise/avoid-new
  await new Promise<void>((resolve, reject) => {
    const server = createServer(async (req, res) => {
      const url = new URL(requestUrl({port, reqUrl: req.url}));
      const returnedNonce = url.searchParams.get('state');
      const satellites = url.searchParams.get('satellites');
      const orbiters = url.searchParams.get('orbiters');
      const missionControl = url.searchParams.get('mission_control');

      if (returnedNonce !== nonce) {
        await respondWithFile(req, res, 400, '../templates/login/failure.html');
        reject(new Error('Unexpected error while logging in.'));
        server.close();
        return;
      }

      try {
        await saveConfig({token, satellites, orbiters, missionControl});
        await respondWithFile(req, res, 200, '../templates/login/success.html');
        console.log(`${green('Success!')} Logged in. ✅`);
        resolve();
      } catch (err) {
        // TODO: another error page
        console.error(err);
        await respondWithFile(req, res, 400, '../templates/login/failure.html');
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        reject(err);
      }

      server.close();
    });

    server.listen(port, async () => {
      const url = authUrl({port, nonce, principal});

      console.log();
      console.log('Visit this URL on this device to log in:');
      console.log(bold(underline(url)));
      console.log();
      console.log('Waiting for authentication...');

      await openUrl({url, browser});
    });

    server.on('error', (err) => {
      reject(err);
    });
  });
};

async function respondWithFile(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  statusCode: number,
  filename: string
) {
  const response = await util.promisify(fs.readFile)(path.join(__dirname, filename));
  res.writeHead(statusCode, {
    'Content-Length': response.length,
    'Content-Type': 'text/html'
  });
  res.end(response);
  req.socket.destroy();
}

const saveConfig = async ({
  token,
  satellites,
  orbiters,
  missionControl
}: {
  token: JsonnableEd25519KeyIdentity;
  satellites: string | null;
  orbiters: string | null;
  missionControl: string | null;
}) => {
  await saveCliConfig({
    token,
    satellites: JSON.parse(decodeURIComponent(satellites ?? '[]')),
    orbiters: orbiters !== null ? JSON.parse(decodeURIComponent(orbiters)) : null,
    missionControl
  });
};
