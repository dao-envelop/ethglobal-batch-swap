// SPDX-License-Identifier: MIT
// ETHGlobal Hackathon. Smart Wallet

pragma solidity ^0.8.30;

import "@Uopenzeppelin/contracts/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts/interfaces/IERC4906.sol";
import "./Wallet.sol";

contract ETHGlobalSmartWallet is 
   Wallet, 
   ERC721Upgradeable, 
   IERC4906
{
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
     * @dev Use this method for interact any dApps onchain
     * @param _target address of dApp smart contract
     * @param _value amount of native token in tx(msg.value)
     * @param _data ABI encoded transaction payload
     */
    function executeEncodedTx(
        address _target,
        uint256 _value,
        bytes memory _data
    ) 
        external 
        onlyWalletKeeper()
        returns (bytes memory r) 
    {
        r = _executeEncodedTx(_target, _value, _data);
    }


    /**
     * @dev Use this method for interact any dApps onchain, executing as one batch
     * @param _targetArray addressed of dApp smart contract
     * @param _valueArray amount of native token in every tx(msg.value)
     * @param _dataArray ABI encoded transaction payloads
     */
    function executeEncodedTxBatch(
        address[] calldata _targetArray,
        uint256[] calldata _valueArray,
        bytes[] memory _dataArray
    ) 
        external 
        onlyWalletKeeper() 
        returns (bytes[] memory r) 
    {
    
        r = _executeEncodedTxBatch(_targetArray, _valueArray, _dataArray);
    }

   

    function name() public pure override returns (string memory) {
        return nftName;
    } 

    function symbol() public pure override returns (string memory) {
        return nftSymbol;
    } 

    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        virtual  
        override(ERC721Upgradeable, ERC1155HolderUpgradeable, IERC165) 
        returns (bool) 
    {
        //TODO  add current contract interface
       return  super.supportsInterface(interfaceId);
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
