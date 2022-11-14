import ky from 'ky';

import { getEndpoint, KnownEndpoints } from '../endpoints/endpoints';

import { useAsyncValue } from '../useAsyncValue/useAsyncValue';

const TXDURLs: Record<KnownEndpoints, string> = {
  'wss://kilt-rpc.dwellir.com': 'https://txd.trusted-entity.io',
  'wss://spiritnet.kilt.io': 'https://txd.trusted-entity.io',
  'wss://peregrine.kilt.io/parachain-public-ws':
    'https://txd-stg.trusted-entity.io',
  'wss://peregrine-stg.kilt.io/para': 'https://txd-stg.trusted-entity.io',
  'wss://sporran-testnet.kilt.io': 'https://txd-stg.trusted-entity.io',
};

async function getTXDSubmitter() {
  const endpoint = await getEndpoint();
  const TXD = TXDURLs[endpoint];

  const { paymentAddress } = await ky
    .get(`${TXD}/meta`)
    .json<{ paymentAddress: string }>();

  return paymentAddress;
}

export function useTXDSubmitter() {
  return useAsyncValue(getTXDSubmitter, []);
}
