// TODO: duplicate AgentJS type until https://github.com/dfinity/icp-js-core/issues/1140 is resolved.
type PublicKeyHex = string;
type SecretKeyHex = string;
export type JsonnableEd25519KeyIdentity = [PublicKeyHex, SecretKeyHex];
