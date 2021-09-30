/* eslint-disable no-undef */
const BlockClockSvgNft = artifacts.require('BlockClockSvgNft.sol');

module.exports = (deployer) => {
  deployer.deploy(BlockClockSvgNft);
};
