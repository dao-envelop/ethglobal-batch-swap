
import {
	useContext,
	useEffect,
	useState
} from "react";
import {
	_ModalTypes,
	ERC20Context,
	InfoModalContext,
	Web3Context
} from "../../dispatchers";
import {
	_AssetType,
	BigNumber,
	ChainType,
	chainTypeToERC20,
	combineURLs,
	getChainId,
	getNullERC20,
	localStorageGet,
	localStorageSet,
	tokenToFloat,
	Web3
} from "@envelop/envelop-client-core";

import {
	getUserSmartWalletsFromAPI
} from "../../utils/smartwallets";

import InputWithOptions from "../InputWithOptions";

import config from '../../app.config.json';
import TokenAmounts from "../TokenAmounts";
import CopyToClipboard from "react-copy-to-clipboard";

import icon_i_copy          from '../../static/pics/icons/i-copy.svg';
import icon_i_reload        from '../../static/pics/loader-blue.svg';

import {
	createSmartWallet,
	getSmartWalletBalances,
} from "../../utils/smartwallets";

type SmartWalletSelectorProps = {
	onWalletSelect?: (e: string) => void,
	onWalletListChange?: (userWallets: Array<SmartWalletType>) => void,
	showError?: boolean,
	callbackAfterCreate?: (userWallets: Array<SmartWalletType>, created: SmartWalletType) => void,
}

type SmartWalletType = {
	contractAddress: string,
	name?: string,
	symbol?: string,
	image?: string,
}
type SavedSmartWalletType = {
	chainId: number,
	userAddress: string,
	contractAddress: string,
	name?: string,
	symbol?: string,
}

export default function SmartWalletSelector(props: SmartWalletSelectorProps) {

	const SMALL_AMOUNT = 0.00001;

	const {
		onWalletSelect,
		onWalletListChange,
		showError,
		callbackAfterCreate,
	} = props;

	const {
		userAddress,
		currentChain,
		web3,
		getWeb3Force,
	} = useContext(Web3Context);
	const {
		erc20List,
		ERC20Balances,
		updateERC20Balance,
	} = useContext(ERC20Context);
	const {
		setModal,
		unsetModal,
		setLoading,
	} = useContext(InfoModalContext);

	const [ smartWalletFactory,              setSmartWalletFactory              ] = useState('');
	const [ userSmartWallets,                setUserSmartWallets                ] = useState<Array<SmartWalletType>>([]);
	const [ smartWalletBalances,             setSmartWalletBalances             ] = useState<Array<{ walletAddress: string, tokenAddress: string, amount: BigNumber }>>([]);

	const [ selectedWallet,                  setSelectedWallet                  ] = useState('');

	const [ inputHideSmallAmounts,           setInputHideSmallAmounts           ] = useState(JSON.parse(localStorageGet('hidesmallamounts') || 'false'));

	const [ noWallets,                       setNoWallets                       ] = useState(true);

	const [ copiedHint,                      setCopiedHint                      ] = useState(false);

	useEffect(() => {

		if ( !currentChain ) { return; }

		try {
			const foundChain = config.CHAIN_SPECIFIC_DATA.find((item) => { return item.chainId === currentChain.chainId });
			if ( !foundChain ) { return; }

			setSmartWalletFactory(foundChain.smartWalletFactory);
			console.log('smartWalletFactoryAddress', foundChain.smartWalletFactory);
		} catch(e) {
			console.log('Cannot load params', e);
		}

	}, [ currentChain ]);
	useEffect(() => {
		console.log('wallet selector useEffect');
		if ( !currentChain ) { return; }
		if ( !userAddress ) { return; }

		setSelectedWallet('');
		if ( onWalletListChange ) { onWalletListChange([]); }
		setUserSmartWallets([]);
		setNoWallets(true);
		if ( onWalletSelect ) { onWalletSelect(''); }

		getUserSmartWalletsFromAPI(currentChain.chainId, userAddress)
			.then((data) => {
				if ( onWalletListChange ) { onWalletListChange(data); }
				if ( data.length ) {
					console.log('data', data);
					setNoWallets(false);
					setUserSmartWallets(data);
				}
			})
			.catch((e) => {
				console.log('Cannot load user wallets', e);
			})

	}, [ currentChain, userAddress ]);

	const createWalletSubmit = async (_currentChain: ChainType, _web3: Web3, _userAddress: string, isMultisig?: boolean) => {

		if ( !smartWalletFactory ) {
			unsetModal();
			setModal({
				type: _ModalTypes.error,
				title: `No smartWallet contract address`,
			});
			return;
		}

		setLoading('Waiting for wallet');

		let txResp;
		try {
			txResp = await createSmartWallet(_web3, smartWalletFactory, _userAddress);
		} catch(e: any) {
			setModal({
				type: _ModalTypes.error,
				title: `Cannot create wallet`,
				details: [
					`Smart wallet contract: ${smartWalletFactory}`,
					`User address: ${userAddress}`,
					'',
					e.message || e,
				]
			});
			return;
		}

		unsetModal();
		const smartWalletsUpdated = [
			...userSmartWallets.filter((item) => { return item.contractAddress.toLowerCase() !== txResp.events.Initialized.address.toLowerCase() }),
			{
				contractAddress: txResp.events.Initialized.address,
			}
		];
		if ( onWalletListChange ) { onWalletListChange(smartWalletsUpdated); }
		setUserSmartWallets(smartWalletsUpdated)
		setSelectedWallet(txResp.events.Initialized.address);
		if ( onWalletSelect ) { onWalletSelect(txResp.events.Initialized.address); }
		setModal({
			type: _ModalTypes.success,
			title: `Wallet has been created`,
			buttons: [{
				text: 'Ok',
				clickFunc: () => {
					unsetModal();
					if ( callbackAfterCreate ) {
						callbackAfterCreate(
							userSmartWallets,
							{
								contractAddress: txResp.events.Initialized.address,
							}
						);
					}
				}
			}],
			copyables: [{
				title: 'Wallet address',
				content: txResp.events.Initialized.address
			}],
			links: [{
				text: `View tx on ${_currentChain.explorerName}`,
				url: combineURLs(_currentChain.explorerBaseUrl, `/tx/${txResp.transactionHash}`)
			}],
		});
	}

	const getHideSmallAmountButton = () => {

		const foundSmallAmountToken = ERC20Balances.find((item) => {
			if ( item.balance.balance.eq(0) ) { return false; }
			if ( !currentChain ) { return false; }

			let foundToken = [
				chainTypeToERC20(currentChain),
				...erc20List
			].find((iitem) => {
				return item.walletAddress.toLowerCase() === selectedWallet.toLowerCase() &&
					item.balance.contractAddress.toLowerCase() === iitem.contractAddress.toLowerCase();
			});
			if ( !foundToken ) {
				foundToken = getNullERC20(item.balance.contractAddress);
			}
			if ( !foundToken.decimals ) { return false; }

			return tokenToFloat(item.balance.balance, foundToken.decimals).lte(SMALL_AMOUNT);
		});
		if ( !foundSmallAmountToken ) { return null; }

		return (
			<div className="input-group mt-5 mb-1">
			<label className="checkbox">
				<input
					type="checkbox"
					name=""
					checked={ inputHideSmallAmounts }
					onChange={(e) => {
						localStorageSet('hidesmallamounts', JSON.stringify(e.target.checked));
						setInputHideSmallAmounts(e.target.checked);
					}}
				/>
				<span className="check"> </span>
				<span className="check-text">
					Hide small amounts
				</span>
			</label>
			</div>
		)
	}
	const getWalletBalancesBlock = () =>  {

		if ( selectedWallet === '' ) { return null; }

		return (
			<div className="col-md-5 mb-5 mb-md-0">
				{ getHideSmallAmountButton() }
				<TokenAmounts
					walletAddress={ selectedWallet }
					tokens={
						smartWalletBalances
						.filter((item) => { return item.walletAddress.toLowerCase() === selectedWallet.toLowerCase() })
						.filter((item) => {
							if ( !currentChain ) { return true; }

							let foundToken = [
								chainTypeToERC20(currentChain),
								...erc20List
							].find((iitem) => {
								return item.tokenAddress.toLowerCase() === iitem.contractAddress.toLowerCase();
							});
							if ( !foundToken ) {
								foundToken = getNullERC20(item.tokenAddress);
							}

							if ( !foundToken.decimals ) { return false; }

							if ( inputHideSmallAmounts ) {
								return tokenToFloat(item.amount, foundToken.decimals).gt(SMALL_AMOUNT);
							} else {
								return !item.amount.eq(0)
							}
						})
						.map((item) => {
							return {
								contractAddress: item.tokenAddress,
								assetType: item.tokenAddress === '0x0000000000000000000000000000000000000000' ? _AssetType.native : _AssetType.ERC20,
								amount: item.amount
							}
						})
					}
					recipients={1}
					rows={99}
					SMALL_AMOUNT={SMALL_AMOUNT}
				/>
			</div>
		)
	}

	const getCopyBtn = () => {

		if ( selectedWallet === '' ) { return null; }

		return (
			<div className="input-group mt-2">
			<CopyToClipboard
				text={ selectedWallet }
				onCopy={() => {
					setCopiedHint(true);
					setTimeout(() => { setCopiedHint(false); }, 5*1000);
				}}
			>
				<button className="btn-copy">
					<img src={ icon_i_copy } alt="" />
					<span className="ml-2">Copy wallet address</span>
					<span className="btn-action-info" style={{ display: copiedHint ? 'block' : 'none' }}>Copied</span>
				</button>
			</CopyToClipboard>
			<button
				className="btn-copy"
				onClick={async () =>{
					if ( !currentChain ) { return; }
					if ( selectedWallet === '' ) { return }
					getSmartWalletBalances(currentChain.chainId, selectedWallet)
						.then((data) => {
							setSmartWalletBalances((prevState) => {
								return [
									...prevState.filter((item) => { return item.walletAddress.toLowerCase() !== selectedWallet.toLowerCase() }),
									...data
								]
							})
						})
				}}
			>
				<img src={ icon_i_reload }/>
				<span className="ml-2">Update balances</span>
			</button>
			</div>
		)
	}

	if ( !currentChain ) { return null; }

	const getSmartWalleLabel = (item: SmartWalletType) => {
		return item.contractAddress;
	}
	const getSmartWalletImage = () => {
		if ( selectedWallet === '' ) { return null; }
		const foundWallet = userSmartWallets.find((item) => { return item.contractAddress.toLowerCase() === selectedWallet.toLowerCase() });
		if ( !foundWallet || !foundWallet.image ) { return null; }

		return (
			<>
			<div className="col-md-12 mb-5 mb-md-0">
				<img style={{ width: '50%' }} src={ foundWallet.image } />
			</div>
			</>
		)
	}
	return (
		<div className="c-wrap">

			<div className="c-wrap__header d-block">
				<div className="row align-items-center">
					<div className="col-12 col-md-auto">
						<div className="h3 mt-0">Smart wallet to use</div>
						{ noWallets ? ( <div className="h4 mt-2 text-green">To use the dapp you need create smart wallet</div> ) : null }
					</div>
				</div>
			</div>

			<div className="row">
				<div className="col-md-6 mb-5 mb-md-0">
				{
					userSmartWallets.length ? (
						<InputWithOptions
							inputClass={`${ showError ? 'has-error' : '' }`}
							value={ selectedWallet }
							placeholder="Select wallet"
							onSelect={(e) => {
								const value = e.value;
								setSelectedWallet(value);
								if ( onWalletSelect ) { onWalletSelect(value); }

								[
									chainTypeToERC20(currentChain),
									...erc20List
								]
									.forEach((item) => {
										const foundBalance = ERC20Balances.find((iitem) => {
											return iitem.walletAddress.toLowerCase() === value.toLowerCase() &&
												iitem.balance.contractAddress.toLowerCase() === item.contractAddress.toLowerCase()
										});
										if ( !foundBalance ) { updateERC20Balance(item.contractAddress, value); }
									})

								getSmartWalletBalances(currentChain.chainId, value)
									.then((data) => {
										setSmartWalletBalances((prevState) => {
											return [
												...prevState.filter((item) => { return item.walletAddress.toLowerCase() !== value.toLowerCase() }),
												...data
											]
										})
									})
							}}
							options={
								userSmartWallets.map((item) => {
									return {
										label: getSmartWalleLabel(item),
										value: item.contractAddress
									}
								})
							}
							showArrow={ true }
						/>
					) : null

				}

					{ getCopyBtn() }

					{ getSmartWalletImage() }

					<div className="d-inline-block mr-2 my-3">
						<button
							className="btn btn-outline"
							disabled={ smartWalletFactory === '' }
							onClick={async () => {

								if ( !currentChain ) { return; }
								let _web3 = web3;
								let _userAddress = userAddress;
								let _currentChain = currentChain;

								if ( !web3 || !userAddress || await getChainId(web3) !== _currentChain.chainId ) {
									setLoading('Waiting for wallet');

									try {
										const web3Params = await getWeb3Force(_currentChain.chainId);

										_web3 = web3Params.web3;
										_userAddress = web3Params.userAddress;
										_currentChain = web3Params.chain;
										unsetModal();
									} catch(e: any) {
										setModal({
											type: _ModalTypes.error,
											title: 'Error with wallet',
											details: [
												e.message || e
											]
										});
										return;
									}
								}

								if ( !_web3 || !_userAddress || !_currentChain ) { return; }

								createWalletSubmit(_currentChain, _web3, _userAddress);

							}}
						>Create smart wallet</button>
					</div>
				</div>
				{ getWalletBalancesBlock() }
			</div>
		</div>
	)

}