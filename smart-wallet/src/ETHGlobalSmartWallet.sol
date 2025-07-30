// SPDX-License-Identifier: MIT
// ETHGlobal Hackathon. Smart Wallet

pragma solidity ^0.8.30;

import "@Uopenzeppelin/contracts/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts/interfaces/IERC4906.sol";

contract ETHGlobalSmartWallet is ERC721Upgradeable, IERC4906{
    using Strings for uint256;
    using Strings for uint160;

    uint256 public constant TOKEN_ID = 1;
    string public constant DEFAULT_BASE_URI = "https://apidev.envelop.is/meta/";
    string constant nftName   = "ETHGlobal Smart Wallet";
    string constant nftSymbol = "ETHGLW";
     

    modifier onlyWalletKeeper() {
        _ownerOrApproved(msg.sender);
        _;
    }
 
     /**
     * @dev Base URI for computing {tokenURI}. If set, the resulting URI for each
     * token will be the concatenation of the `baseURI` and the `tokenId`. Empty
     * by default, can be overridden in child contracts.
     */
    function _baseURI() internal view override virtual returns (string memory) {
        return string(
            abi.encodePacked(
                DEFAULT_BASE_URI,
                block.chainid.toString(),
                "/",
                uint160(address(this)).toHexString(),
                "/"
            )
        );
    }

    function  _ownerOrApproved(address _sender) internal view virtual {
        address currOwner = ownerOf(TOKEN_ID);
        require(
            currOwner == _sender ||
            isApprovedForAll(currOwner, _sender) ||
            getApproved(TOKEN_ID) == _sender,
            "Only owner or keeper"
        );
    }
    
}
