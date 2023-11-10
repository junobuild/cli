import {get, type RequestOptions} from 'https';

export const downloadFromURL = async (url: string | RequestOptions): Promise<Buffer> => {
  return await new Promise((resolve, reject) => {
    get(url, async (res) => {
      if (res.statusCode !== undefined && [301, 302].includes(res.statusCode)) {
        await downloadFromURL(res.headers.location!).then(resolve, reject);
      }

      const data: any[] = [];

      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () => {
        resolve(Buffer.concat(data));
      });
      res.on('error', reject);
    });
  });
};
