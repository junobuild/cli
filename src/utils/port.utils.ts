import {getPortPromise, setBasePort} from 'portfinder';

setBasePort(9005);

export const getPort = async (): Promise<number> => await getPortPromise();
