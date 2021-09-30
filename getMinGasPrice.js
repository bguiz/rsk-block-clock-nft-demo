/* eslint-disable */
const axios = require('axios');

async function getMinGasPrice(url) {
  const latestBlock = await axios({
    url,
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    data: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_getBlockByNumber',
      params: ['latest', false],
      id: 1,
    }),
  });
  const minGasPrice = parseInt(latestBlock.data.result.minimumGasPrice, 16);
  if (typeof minGasPrice !== 'number' || Number.isNaN(minGasPrice)) {
    throw new Error(`Unable to retrieve network gas price from ${url}`);
  }
  return minGasPrice;
}

module.exports = getMinGasPrice;
