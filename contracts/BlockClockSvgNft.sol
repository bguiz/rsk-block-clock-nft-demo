// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;
import { IBlockClockSvgNft } from './IBlockClockSvgNft.sol';
import { Bridge } from './Bridge.sol';
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract BlockClockSvgNft is
    IBlockClockSvgNft,
    ERC721
{
    struct TokenData {
        bytes3 bitcoinLeafColour;
        bytes3 rskLeafColour;
    }

    uint256 tokenCount;
    // Mapping from token ID to token data
    mapping(uint256 => TokenData) private tokens;

    event TokenInfo(uint256 _tokenId, bytes3 _bitcoinLeafColour, bytes3 _rskLeafColour);

    constructor()
        ERC721("TestBlockClockNft", "TestBCLK")
    {
        tokenCount = 0;
    }

    function create(
        bytes3 bitcoinLeafColour,
        bytes3 rskLeafColour
    )
        public
    {
        uint256 tokenId = ++tokenCount;
        TokenData memory newToken = TokenData(
            bitcoinLeafColour,
            rskLeafColour
        );
        tokens[tokenId] = newToken;
        _safeMint(msg.sender, tokenId);
        emit TokenInfo(tokenId, bitcoinLeafColour, rskLeafColour);
    }

    function renderSvgLogo(uint256 _tokenId) public view override returns(string memory) {
        bytes3 bitcoinLeafColour = tokens[_tokenId].bitcoinLeafColour;
        bytes3 rskLeafColour = tokens[_tokenId].rskLeafColour;
        (uint256 btcBlockNum, uint256 rskBlockNum) = getRskBtcBlockNumbers();
        string memory svgLogo = getRenderedSvgLogo(btcBlockNum, rskBlockNum, bitcoinLeafColour, rskLeafColour);
        return svgLogo;
    }

    function getRskBtcBlockNumbers() public view override returns(uint256, uint256) {
        uint256 rskBlockNumber = block.number;
        uint256 bestChainHeight = uint256(getBridge().getBtcBlockchainBestChainHeight());
        return (bestChainHeight, rskBlockNumber);
    }

    function getRenderedSvgLogo(
      uint256 _btcBlockNum,
      uint256 _rskBlockNum,
      bytes3 _bitcoinLeafColour,
      bytes3 _rskLeafColour
    ) private pure returns(string memory) {
        string memory header = '<svg width="640" height="640" stroke="#000" stroke-width="10" fill="#fff" version="1.1" xmlns="http://www.w3.org/2000/svg"><g transform="translate(320,320)"><polygon points="0 -134,120 -60,120 60,0 134,-120 60,-120 -60"/><line x1="0" y1="-134" x2="0" y2="134"/><line x1="120" y1="-60" x2="-120" y2="60"/><line x1="120" y1="60" x2="-120" y2="-60"/><circle cx="0" cy="-134" r="25"/><circle cx="120" cy="-60" r="25"/><circle cx="120" cy="60" r="25"/><circle cx="0" cy="134" r="25"/><circle  cx="-120" cy="60" r="25"/><circle cx="-120" cy="-60" r="25"/><circle cx="0" cy="0" r="25"/><g stroke-width="6"><ellipse cx="-229" cy="0" rx="60" ry="32" transform="rotate(';
        string memory fill = ', 0, 0)" fill="#';
        string memory ellipse = '"/><ellipse cx="-209" cy="0" rx="40" ry="21" transform="rotate(';
        string memory footer = '"/></g></g></svg>';
        return string(abi.encodePacked(
            header,
            uint2str(getHourHandAngle(_btcBlockNum)),
            fill,
            bytes3ToHexStr(_bitcoinLeafColour),
            ellipse,
            uint2str(getMinuteHandAngle(_rskBlockNum)),
            fill,
            bytes3ToHexStr(_rskLeafColour),
            footer
        ));
    }

    function getBridge() private pure returns (Bridge) {
        return Bridge(address(0x01000006));
    }

    function uint8ToHexCharCode(uint8 i) private pure returns (uint8) {
        return (i > 9) ?
            (i + 87) : // ascii a-f
            (i + 48); // ascii 0-9
    }

    function uint24ToHexStr(uint24 i) public pure returns (string memory) {
        bytes memory o = new bytes(6);
        uint24 mask = 0x00000f; // hex 15
        for(uint k = 6; k >= 1; k -= 1) {
          o[k - 1] = bytes1(uint8ToHexCharCode(uint8(i & mask)));
          i >>= 4;
        }
        return string(o);
    }

    function bytes3ToHexStr(bytes3 i) private pure returns (string memory) {
      uint24 n = uint24(i);
      return uint24ToHexStr(n);
    }

    // https://stackoverflow.com/questions/47129173/how-to-convert-uint-to-string-in-solidity
    function uint2str(uint _i) private pure returns (string memory _uintAsString) {
        if (_i == 0) {
            return "0";
        }
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len;
        while (_i != 0) {
            k = k-1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }

    function getHourHandAngle(uint256 _value) private pure returns(uint256) {
        return (_value % 6) * 60 + 90;
    }

    function getMinuteHandAngle(uint256 _value) private pure returns(uint256) {
        return (_value % 20) * 18 + 90;
    }
}
