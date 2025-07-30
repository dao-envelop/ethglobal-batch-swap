// SPDX-License-Identifier: MIT
// ETHGlobal Hackathon. Smart Wallet

pragma solidity ^0.8.30;

import "@Uopenzeppelin/contracts/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts/interfaces/IERC4906.sol";
import "./Wallet.sol";
import "./IWalletFactory.sol";

contract ETHGlobalSmartWallet is 
   Wallet, 
   ERC721Upgradeable, 
   IERC4906
{
    using Strings for uint256;
    using Strings for uint160;

    struct InitParams {
        address creator;
        string nftName;
        string nftSymbol;
        string tokenUri;
        address[] addrParams;    
        bytes32[] hashedParams;  
        uint256[] numberParams;  
        bytes bytesParam;        
    }


    uint256 public constant TOKEN_ID = 1;
    string public constant DEFAULT_BASE_URI = "https://apidev.envelop.is/meta/";
    string constant nftName   = "ETHGlobal Smart Wallet";
    string constant nftSymbol = "ETHGLW";
    address private immutable __self = address(this);
    address public immutable FACTORY;
    string public constant INITIAL_SIGN_STR = 
        "initialize("
          "(address,string,string,string,address[],bytes32[],uint256[],bytes)"
        ")";

    // TODO  - we need this  par if we will decide to store some init data
    // keccak256(abi.encode(uint256(keccak256("ETHglobal.storage.ETHGlobalSmartWallet")) - 1)) & ~bytes32(uint256(0xff))
    // bytes32 private constant ETHGlobalSmartWalletStorageLocation = 0x9c28a3e16904e8ce637bd478bcb110b5372d9fc9cb511d8abde2a25d02a70900;
    // function _getETHGlobalSmartWalletStorage() private pure returns (ETHGlobalSmartWalletStorage storage $) {
    //     assembly {
    //         $.slot := ETHGlobalSmartWalletStorageLocation
    //     }
    // }

    // Out of main storage because setter not supporrts delegate calls 
    // This nonce for create proxy with deterministic addresses `createWalletonFactory2`
    mapping(address sender => uint256 nonce) public nonce;

    error NoDelegateCall();

    /**  OZ
     * @dev Check that the execution is not being performed through a delegate call. 
     * This allows a function to be
     * callable on the implementing contract but not through proxies.
     */
    modifier notDelegated() {
        _checkNotDelegated();
        _;
    }

    modifier onlyWalletKeeper() {
        _ownerOrApproved(msg.sender);
        _;
    }

    constructor(address _defaultFactory) {
        // Zero address for _defaultFactory  is ENABLEd. Because some inheritors
        // would like to switch OFF using `createWNFTonFactory` from  implementation
        FACTORY = _defaultFactory;    
        _disableInitializers();
    }

    ////////////////////////////////////////////////////////////////////////
    // OZ style init functions layout                                     //
    ////////////////////////////////////////////////////////////////////////  
    function initialize(
        InitParams calldata _init
    ) public payable virtual initializer 
    {
        __ETHGlobalSmartWallet_init(_init);
    }
    /**
     * @dev Initializes the contract by setting a `name` and a `symbol` to the token collection.
     */
    function __ETHGlobalSmartWallet_init(
          InitParams calldata _init
    ) internal onlyInitializing fixEtherBalance {
        // TODO    may be remove  for  save  gas
        __ERC721_init_unchained(_init.nftName, _init.nftSymbol);    
        __ETHGlobalSmartWallet_init_unchained(_init);
    }

    function __ETHGlobalSmartWallet_init_unchained(
        InitParams calldata _init
    ) internal onlyInitializing {
        _mint(_init.creator, TOKEN_ID);
        emit MetadataUpdate(TOKEN_ID);
    }


    /////////////////////////////////////////////////////////////////////
    /**  
     * @dev This can be called from anybody  to create proxy for this implementation
     * @param _init  see `struct InitParams` above. 
     */
    function createWalletOnFactory(InitParams memory _init) 
        public 
        virtual
        notDelegated 
        returns(address wallet) 
    {
        wallet = IWalletFactory(FACTORY).createWallet(
            address(this), 
            abi.encodeWithSignature(INITIAL_SIGN_STR, _init)
        );
    }

    /**  
     * @dev This can be called from anybody  to create proxy for this implementation
     * in deterministic way. `predictDeterministicAddress` from factory
     * can be used to predict proxy address. 
     * @param _init  see `struct InitParams` above. 
     */
    function createWalletOnFactory2(InitParams memory _init) 
        public
        virtual 
        notDelegated 
        returns(address wallet) 
    {
        bytes32 salt = keccak256(abi.encode(address(this), msg.sender, ++ nonce[msg.sender]));
        wallet = IWalletFactory(FACTORY).createWallet(
            address(this), 
            abi.encodeWithSignature(INITIAL_SIGN_STR, _init),
            salt
        );
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
    //////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////

    /**      From OZ
     * @dev Reverts if the execution is performed via delegatecall.
     * See {notDelegated}.
     */
    function _checkNotDelegated() internal view virtual {
        if (address(this) != __self) {
            // Must not be called through delegatecall
            revert NoDelegateCall();
        }
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
