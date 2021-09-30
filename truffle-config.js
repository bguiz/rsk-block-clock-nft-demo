const path = require('path');
const fs = require('fs');
const HDWalletProvider = require('@truffle/hdwallet-provider');

const TESTNET_GAS_MULT = 1.1;
const MAINNET_GAS_MULT = 1.02;

const mnemonic = fs.readFileSync('.secret').toString().trim();
if (!mnemonic || mnemonic.split(' ').length !== 12) {
  console.log('unable to retrieve mnemonic from .secret');
}

// Update gas price Testnet
/* Run this first, to use the result in truffle-config:
  curl https://public-node.testnet.rsk.co/ -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_getBlockByNumber","params":["latest",false],"id":1}' \
    > .minimum-gas-price-testnet.json
*/
const gasPriceTestnetRaw = fs
  .readFileSync('.minimum-gas-price-testnet.json')
  .toString()
  .trim();
const minimumGasPriceTestnet = parseInt(
  JSON.parse(gasPriceTestnetRaw).result.minimumGasPrice,
  16,
);
if (
  typeof minimumGasPriceTestnet !== 'number' ||
  Number.isNaN(minimumGasPriceTestnet)
) {
  throw new Error(
    'unable to retrieve network gas price from .gas-price-testnet.json',
  );
}
console.log(`Minimum gas price Testnet: ${minimumGasPriceTestnet}`);

// Update gas price Mainnet
/* Run this first, to use the result in truffle-config:
  curl https://public-node.rsk.co/ -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_getBlockByNumber","params":["latest",false],"id":1}' \
    > .minimum-gas-price-mainnet.json
*/
const gasPriceMainnetRaw = fs
  .readFileSync('.minimum-gas-price-mainnet.json')
  .toString()
  .trim();
const minimumGasPriceMainnet = parseInt(
  JSON.parse(gasPriceMainnetRaw).result.minimumGasPrice,
  16,
);
if (
  typeof minimumGasPriceMainnet !== 'number' ||
  Number.isNaN(minimumGasPriceMainnet)
) {
  throw new Error(
    'unable to retrieve network gas price from .gas-price-mainnet.json',
  );
}
console.log(`Minimum gas price Mainnet: ${minimumGasPriceMainnet}`);
module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, 'client/contracts'),
  networks: {
    develop: {
      port: 8545,
    },
    /*
    to run regtest:
    % rm -rf ~/.rsk/regtest/
    % java -classpath ~/.rsk/rskj-core-3.0.1-IRIS-all.jar -Drpc.providers.web.cors=\* -Drpc.providers.web.ws.enabled=true co.rsk.Start --regtest
    % truffle console --network regtest
    */
    regtest: {
      host: '127.0.0.1',
      port: 4444,
      network_id: '*',
      networkCheckTimeout: 1e3,
    },
    // % truffle console --network testnet
    testnet: {
      provider: () =>
        new HDWalletProvider({
          mnemonic: {
            phrase: mnemonic,
          },
          providerOrUrl: 'https://public-node.testnet.rsk.co/',
          // Higher polling interval to check for blocks less frequently
          pollingInterval: 15e3,
        }),
      network_id: 31,
      gasPrice: Math.floor(minimumGasPriceTestnet * TESTNET_GAS_MULT),
      networkCheckTimeout: 1e6,
      timeoutBlocks: 100,
      // Higher polling interval to check for blocks less frequently during deployment
      deploymentPollingInterval: 15e3,
    },
    mainnet: {
      provider: () =>
        new HDWalletProvider(mnemonic, 'https://public-node.rsk.co'),
      network_id: 30,
      gasPrice: Math.floor(minimumGasPriceMainnet * MAINNET_GAS_MULT),
      networkCheckTimeout: 1e9,
    },
  },
  compilers: {
    solc: {
      version: '0.8.7',
    },
  },
};
