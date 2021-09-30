// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

interface IBlockClockSvgNft {
  function renderSvgLogo(uint256) external view returns(string memory);
  function getRskBtcBlockNumbers() external view returns(uint256, uint256);
}
