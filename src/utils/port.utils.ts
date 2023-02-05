import {getPortPromise, setBasePort} from 'portfinder';

setBasePort(9005);

export const getPort = (): Promise<number> => getPortPromise();
