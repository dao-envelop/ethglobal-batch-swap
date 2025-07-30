import React, {
	useContext,
	useEffect,
	useRef,
	useState
} from "react";

import {
	_AdvancedLoadingStatus,
	_ModalTypes,
	ERC20Context,
	InfoModalContext,
	Web3Context,
} from "../../dispatchers";

import {
	addThousandSeparator,
	BigNumber,
	ChainType,
	chainTypeToERC20,
	combineURLs,
	ERC20Type,
	getChainId,
	getNullERC20,
	localStorageGet,
	removeThousandSeparator,
	tokenToFloat,
	Web3
} from "@envelop/envelop-client-core";

import SmartWalletSelector from "../SmartWalletSelector";
import TippyWrapper from "../TippyWrapper";
import CoinSelector from "../CoinSelector";

import icon_i_del   from '../../static/pics/i-del.svg';
import icon_loading from '../../static/pics/loading.svg';;

import config        from '../../app.config.json';

type ContentTokenRowType = {
	address: string,
	percent: string,
	timeAdded?: number,
	convertedValue?: BigNumber,
	status?: string,
}

export default function BatchSwap() {

	const MAX_CONTENT_TOKENS = 6;

	const {
		userAddress,
		currentChain,
		currentChainId,
		web3,
		getWeb3Force,
		balanceNative
	} = useContext(Web3Context);
	const {
		setModal,
		setError,
		setInfo,
		unsetModal,
		setLoading,
		createAdvancedLoader,
		updateStepAdvancedLoader,
	} = useContext(InfoModalContext);
	const {
		erc20List,
		requestERC20Token,
		ERC20Balances,
		updateERC20Balance,
		updateAllBalances,
	} = useContext(ERC20Context);

	const walletBlockRef = useRef(null);
	const [ walletToUse,                     setWalletToUse                     ] = useState('');

	const checkoutTokenBlockRef = useRef(null);
	const [ inputCheckoutTokenAddress,       setInputCheckoutTokenAddress       ] = useState('');
	const [ inputCheckoutTokenAmount,        setInputCheckoutTokenAmount        ] = useState('');
	const [ supportedCheckoutTokens,         setSupportedCheckoutTokens         ] = useState<Array<string>>([]);

	const [ inputContentTokenAddress,        setInputContentTokenAddress        ] = useState('');
	const [ contentTokens,                   setContentTokens                   ] = useState<Array<ContentTokenRowType>>([]);

	const [ swapRouterAddress,               setSwapRouterAddress               ] = useState('');
	const [ swapError,                       setSwapError                       ] = useState('');

	const [ showError,                       setShowError                       ] = useState(false);

	useEffect(() => {

		if ( !currentChain ) { return; }

		try {
			const foundChain = config.CHAIN_SPECIFIC_DATA.find((item) => { return item.chainId === currentChain.chainId });
			if ( !foundChain || !foundChain.WNFTFactory ) { return; }

			// setWNFTV2IndexAddress(foundChain.WNFTV2Index);
			// console.log('WNFTV2Index', foundChain.WNFTV2Index);

			setSupportedCheckoutTokens(foundChain.checkoutTokens);
		} catch(e) {
			console.log('Cannot load params', e);
		}

	}, [ currentChain ]);

	const getCheckoutSumBlock = () => {

		if ( !currentChain ) { return null; }

		const tokensToRender = supportedCheckoutTokens.map((item) => {
			if ( currentChain && item === '0x0000000000000000000000000000000000000000' ) { return chainTypeToERC20(currentChain); }
			const foundERC20 = erc20List.find((iitem) => { return iitem.contractAddress.toLowerCase() === item.toLowerCase() });
			if ( !foundERC20 ) {
				requestERC20Token(item);
				return getNullERC20(item);
			}
			return foundERC20;
		});

		let tokenDecimals;
		let checkoutTokenBalance;
		let checkoutTokenBalanceMaster;
		if (
			inputCheckoutTokenAddress !== '' &&
			Web3.utils.isAddress(inputCheckoutTokenAddress)
		) {

			const foundToken = tokensToRender.find((item) => { return item.contractAddress.toLowerCase() === inputCheckoutTokenAddress.toLowerCase() });
			if ( foundToken ) { tokenDecimals = foundToken.decimals }

			if ( userAddress ) {
				const foundBalance = ERC20Balances.find((item) => {
					return item.balance.contractAddress.toLowerCase() === inputCheckoutTokenAddress.toLowerCase() &&
						item.walletAddress.toLowerCase() === userAddress.toLowerCase()
				});
				if ( foundBalance ) {
					checkoutTokenBalance = tokenToFloat(foundBalance.balance.balance, tokenDecimals || 18);
				} else {
					updateERC20Balance(inputCheckoutTokenAddress, userAddress);
				}
			}

			if ( walletToUse !== '' ) {
				const foundBalanceMaster = ERC20Balances.find((item) => {
					return item.balance.contractAddress.toLowerCase() === inputCheckoutTokenAddress.toLowerCase() &&
						item.walletAddress.toLowerCase() === walletToUse.toLowerCase()
				});

				if ( foundBalanceMaster ) {
					checkoutTokenBalanceMaster = tokenToFloat(foundBalanceMaster.balance.balance, tokenDecimals || 18);
				} else {
					updateERC20Balance(inputCheckoutTokenAddress, walletToUse);
				}
			}

		}

		const isErrorCheckoutTokenAddress = () => {
			if (
				inputCheckoutTokenAddress !== '' && swapError.toLowerCase().includes(inputCheckoutTokenAddress.toLowerCase())
			) { return true; }

			if ( !showError ) { return false; }
			if (
				inputCheckoutTokenAddress === ''
			) { return true; }

			return false;
		}
		const isErrorCheckoutTokenAmount = () => {
			if ( !showError ) { return false; }
			if ( inputCheckoutTokenAmount === '' ) { return true; }

			return false;
		}
		return (
			<div className="c-wrap">

				<div className="c-wrap__header d-block">
					<div className="row align-items-center">
						<div className="col-12 col-md-auto">
							<div className="h3 mt-0">Source token</div>
						</div>
					</div>
				</div>

				<div className="row">

					<div className="col-md-6 pl-md-6">
						<div className="input-group mb-3" ref={ checkoutTokenBlockRef }>
							<label className="input-label">
								Address
							</label>
							<div className="select-group">
								<input
									className={`input-control ${ isErrorCheckoutTokenAddress() ? 'has-error' : '' }`}
									type="text"
									placeholder="0x000"
									value={ inputCheckoutTokenAddress }
									onChange={(e) => {
										const value = e.target.value.toLowerCase().replace(/[^a-f0-9x]/g, "");
										setInputCheckoutTokenAddress(value);
										setSwapError('');
										if ( Web3.utils.isAddress(value) ) {
											const foundToken = erc20List.find((item) => { return item.contractAddress.toLowerCase() === value.toLowerCase() });
											if ( !foundToken ) { requestERC20Token(value, userAddress); return; }
											if ( foundToken.balance.eq(0) ) { updateERC20Balance(value, userAddress || ''); }
										}
									}}
								/>
								<CoinSelector
									tokens        = { tokensToRender }
									selectedToken = { inputCheckoutTokenAddress }
									onChange      = {(address: string) => {
										setInputCheckoutTokenAddress(address);
										setSwapError('');
									}}
								/>
							</div>
						</div>
						<div className="input-group mb-3">
							<label className="input-label">
								Amount
							</label>
							<div className="select-group">
								<input
									className={`input-control ${ isErrorCheckoutTokenAmount() ? 'has-error' : '' }`}
									type="text"
									placeholder="0.000"
									value={ addThousandSeparator(inputCheckoutTokenAmount) }
									onChange={(e) => {
										let value = removeThousandSeparator(e.target.value);
										if ( value !== '' && !value.endsWith('.') && !value.endsWith('0') ) {
											if ( new BigNumber(value).isNaN() ) {
												return;
											}
											value = new BigNumber(value).toString();
										}
										setSwapError('');
										setInputCheckoutTokenAmount(value);
									}}
								/>
							</div>
							{
								checkoutTokenBalance ? (
									<div className="c-add__max mt-2 mb-0">
										<div className="mt-1">
											<span>User wallet. Balance: </span>
											<button
												onClick={() => {
													setInputCheckoutTokenAmount(checkoutTokenBalance.toString());
												}}
											>{ checkoutTokenBalance.toFixed(5) }</button>
										</div>
									</div>
								) : null
							}
							{
								checkoutTokenBalanceMaster ? (
									<div className="c-add__max mt-2 mb-0">
										<div className="mb-1">
											<span>Smart wallet. Balance: </span>
											<button
												onClick={() => {
													setInputCheckoutTokenAmount(checkoutTokenBalanceMaster.toString());
												}}
											>{ checkoutTokenBalanceMaster.toFixed(5) }</button>
										</div>
									</div>
								) : null
							}
						</div>
					</div>

				</div>
			</div>
		)
	}

	const recalcPercents = (recs: Array<ContentTokenRowType>) => {
		setSwapError('');

		let sum = 10000;
		const recLength = recs.length;
		return recs.map((item: ContentTokenRowType): ContentTokenRowType => {
			let percentToAdd;
			if ( sum > Math.ceil(10000 / recLength) + recLength ) {
				percentToAdd = new BigNumber(Math.floor(10000 / recLength)).dividedBy(100);
				sum = sum - Math.floor(10000 / recLength);
			} else {
				percentToAdd = new BigNumber(sum).dividedBy(100);
				sum = 0;
			}
			return {
				...item,
				percent: percentToAdd.toFixed(2)
			}
		});
	}
	const addContentTokens = (address: string) => {

		setSwapError('');

		if ( contentTokens.length >= MAX_CONTENT_TOKENS ) { return; }

		const foundContentTokens = contentTokens.find((item) => {
			return item.address.toLowerCase() === address.toLowerCase()
		});
		if ( foundContentTokens ) { return; }

		const contentTokensUpdated = [
			...contentTokens,
			{
				address: address,
				percent: '0',
				timeAdded: new Date().getTime(),
			}
		];

		setContentTokens(contentTokensUpdated);
		setInputContentTokenAddress('');
	}
	const removeContentTokens = (address: string) => {
		setSwapError('');

		let contentTokensUpdated: Array<ContentTokenRowType>;

		contentTokensUpdated = contentTokens.filter((item) => {
			if ( !item.address ) { return true; }
			return item.address.toLowerCase() !== address.toLowerCase()
		});

		setContentTokens(contentTokensUpdated);
		setInputContentTokenAddress('');
	}
	const getAddContentTokensBtn = () => {
		return (
			<button
				className="btn btn-grad"
				type="submit"
				disabled={ isAddContentTokensDisabled() }
				onClick={() => {
					addContentTokens(inputContentTokenAddress);
				}}
			>Add</button>
		)
	}
	const isAddContentTokensDisabled = () => {
		if ( inputContentTokenAddress === '' ) { return true; }
		if ( !Web3.utils.isAddress(inputContentTokenAddress) ) { return true; }
		if ( contentTokens.length >= MAX_CONTENT_TOKENS ) { return true; }
		return false;
	}
	const getContentTokenAmountWrapper = (item: ContentTokenRowType) => {
		const DECIMALS_TO_SHOW = 5;

		if ( !currentChain ) { return; }

		if ( item.status === 'loading' ) {
			return (
				<span className="text-break">
					<div className="tb-coin">
						<img className="loading" src={ icon_loading } alt="" />
					</div>
				</span>
			)
		}

		const output = getContentTokenAmount(item);
		if ( !output || output.isNaN() ) { return '—' }

		if ( !output.eq(0) && output.lt(10**-DECIMALS_TO_SHOW) ) {
			return (
				<TippyWrapper msg={ output.toString() }>
					<span className="text-break">
					<div className="tb-coin">
						&lt;{ new BigNumber(10**-DECIMALS_TO_SHOW).toFixed(DECIMALS_TO_SHOW) }
					</div>
					</span>
				</TippyWrapper>
			)
		}

		return (
			<span className="text-break">
				<div className="tb-coin">
					{ output.eq(0) ? '0' : output.toFixed(DECIMALS_TO_SHOW) }
				</div>
			</span>
		)
	}
	const getContentTokenAmount = (item: ContentTokenRowType, qty?: number) => {

		// if ( inputCheckoutTokenAddress === '' ) { return undefined; }
		// if ( inputCheckoutTokenAmount === '' ) { return undefined; }

		// let outRate;

		// const foundRate = currencyRates.find((iitem) => { return iitem.contractAddress.toLowerCase() === item.address.toLowerCase() });
		// if ( !foundRate ) {
		// 	requestERC20CurrencyRate(item.address);
		// 	return undefined;
		// }

		// const foundNativeRate = currencyRates.find((iitem) => { return iitem.contractAddress.toLowerCase() === inputCheckoutTokenAddress.toLowerCase() });
		// if ( !foundNativeRate ) {
		// 	requestERC20CurrencyRate(inputCheckoutTokenAddress);
		// 	return undefined;
		// }
		// outRate = foundRate.value.dividedBy(foundNativeRate.value);

		// const fee = new BigNumber(inputCheckoutTokenAmount);
		// if ( !fee || fee.isNaN() ) { return undefined }

		// const percent = new BigNumber(item.percent).dividedBy(100);

		// return fee.multipliedBy(percent).dividedBy(outRate);

		if ( !item.convertedValue ) { return undefined; }

		let foundERC20;
		if ( item.address === '0x0000000000000000000000000000000000000000' && currentChain ) {
			foundERC20 = chainTypeToERC20(currentChain);
		} else {
			foundERC20 = erc20List.find((iitem) => { return iitem.contractAddress.toLowerCase() === item.address.toLowerCase() });
		}

		if ( qty ) {
			return tokenToFloat(item.convertedValue.dividedToIntegerBy(qty), foundERC20?.decimals);
		} else {
			return tokenToFloat(item.convertedValue, foundERC20?.decimals);
		}
	}
	const getContentTokensRow = (item: ContentTokenRowType, idx: number) => {

		let foundERC20;
		if ( item.address === '0x0000000000000000000000000000000000000000' && currentChain ) {
			foundERC20 = chainTypeToERC20(currentChain);
		} else {
			foundERC20 = erc20List.find((iitem) => { return iitem.contractAddress.toLowerCase() === item.address.toLowerCase() });
		}
		if ( !foundERC20 ) { foundERC20 = getNullERC20(item.address || '') }

		return (
			<React.Fragment key={ item.address || 'none' }>
			<div
				className={`item ${ item.status?.toLowerCase().startsWith('error') ? 'has-error' : '' }`}
			>
				<div className="row">
					<div className="mb-2 col-12 col-md-1">#{ idx }</div>
					<div className="mb-3 mb-md-2 col-12 col-md-2">
						<div className="tb-coin">
							<span className="i-coin"><img src={ foundERC20.icon } alt="" /></span>
							<span>{ foundERC20.symbol }</span>
						</div>
					</div>
					{/* <div className="mb-3 mb-md-2 col-12 col-md-6">
						<span className="col-legend">Token: </span>
						<span className="text-break">{ foundERC20.symbol }</span>
					</div> */}
					<div className="mb-2 col-12 col-md-2">
						<div className="tb-input tb-percent">
							<input
								className="input-control"
								type="text"
								value={ item.percent.toString() }
								tabIndex={100+idx}
								onFocus={(e) => { e.target.select() }}
								onChange={(e) => {

									let value = e.target.value.replaceAll(' ', '').replaceAll(',', '.');
									const valueParsed = new BigNumber(value);

									if ( value === '' ) {
										value = '';
									} else {
										if ( valueParsed.isNaN() ) { return; }
										if ( valueParsed.gt(100) ) { return; }
									}

									// plain address
									const foundContentTokens = contentTokens.filter((iitem) => {
										if ( !iitem.address ) { return false; }
										if ( !item.address ) { return false; }
										return iitem.address.toLowerCase() === item.address.toLowerCase()
									});
									if ( foundContentTokens.length ) {
										const contentTokensUpdated = [
											...contentTokens.filter((iitem) => {
												return iitem.address.toLowerCase() !== item.address.toLowerCase()
											}),
											{
												address: item.address,
												percent: value,
												timeAdded: foundContentTokens[0].timeAdded
											},
										];
										setContentTokens(contentTokensUpdated);

									}
								}}
								onBlur={() => {
									const contentTokensUpdated = contentTokens.map((item) => {
										if ( item.percent === '' ) { return item; }
										return {
											...item,
											percent: new BigNumber(item.percent).toFixed(2, BigNumber.ROUND_DOWN)
										}
									});
									setContentTokens(contentTokensUpdated);
								}}
							/>
						</div>
					</div>
					<div className="mb-2 col-12 col-md-4">
						<span className="col-legend">Amount: </span>
						{ getContentTokenAmountWrapper(item) }
					</div>
					{
						item.address ? (
							<button
								className="btn-del"
								onClick={() => { removeContentTokens(item.address) }}
							><img src={ icon_i_del } alt="" /></button>
						): null
					}
				</div>
			</div>
			{/* {
				item.status?.toLowerCase().startsWith('error') ? (
					<div className="item-error">{ item.status }</div>
				) : null
			} */}
			</React.Fragment>
		)
	}

	const getDistributionAlert = () => {
		if ( contentTokens.length ) {
			if ( !isDistributionSumEquals100(contentTokens) ) { return ( <div className="alert alert-error mt-3">Percent is not equal 100</div> ) }
		}

		return null;
	}
	const isDistributionSumEquals100 = (_contentTokens: Array<ContentTokenRowType>) => {
		const sumPercent = _contentTokens.reduce((acc, item) => {
			const percentToAdd = new BigNumber(item.percent);
			if ( percentToAdd.isNaN() ) { return acc }
			return acc.plus(percentToAdd)
		}, new BigNumber(0));

		return sumPercent.eq(100);
	}
	const getSwapErrorsAlert = () => {
		if ( swapError === '' ) { return null; }

		return ( <div className="alert alert-error mt-3">{ swapError }</div> )
	}
	const filterERC20List = (permissions: {
		enabledForCollateral?        : boolean,
		enabledForFee?               : boolean,
		enabledRemoveFromCollateral? : boolean,
	}): Array<ERC20Type> => {
		if ( currentChain ) {
			return [
				chainTypeToERC20(currentChain),
				...erc20List.filter((item) => { return !item.isSpam })
			];
		} else {
			return erc20List.filter((item) => { return !item.isSpam });
		}
		// return erc20List;
	}
	const getContentTokensBlock = () => {

		return (
			<div className="c-wrap">
				<div className="c-wrap__header d-block">
					<div className="row align-items-center">
						<div className="col-12 col-md-auto">
							<div className="h3 mt-0">Target tokens</div>
						</div>
					</div>
				</div>
				<div className="c-wrap__form">
					<div className="row mb-1">
						<div className="col col-12 col-md-6">
							<label className="input-label">
								Address
							</label>
							<div className="select-group">
								<input
									className="input-control"
									type="text"
									placeholder="0x000"
									value={ inputContentTokenAddress }
									onChange={(e) => {
										const value = e.target.value.toLowerCase().replace(/[^a-f0-9x]/g, "");
										setInputContentTokenAddress(value);
										if ( Web3.utils.isAddress(value) ) {
											const foundToken = erc20List.find((item) => { return item.contractAddress.toLowerCase() === value.toLowerCase() });
											if ( !foundToken || foundToken.balance.eq(0) ) { requestERC20Token(value, userAddress); }
										}
									}}
								/>
								<CoinSelector
									tokens        = { filterERC20List({ enabledForFee: true }) }
									selectedToken = { inputContentTokenAddress }
									onChange      = {(address: string) => {
										setInputContentTokenAddress(address);
										if ( Web3.utils.isAddress(address) ) {
											const foundToken = erc20List.find((item) => { return item.contractAddress.toLowerCase() === address.toLowerCase() });
											if ( !foundToken || foundToken.balance.eq(0) ) { requestERC20Token(address, userAddress); }
										}
									}}
								/>
							</div>
						</div>
						<div className="col col-12 col-md-2">
							<label className="input-label">&nbsp;</label>
							{ getAddContentTokensBtn() }
						</div>
					</div>

					{
						contentTokens.length && !isDistributionSumEquals100(contentTokens) ?
						(
							<div className="row">
								<div className="col-sm-6 col-md-3">
									<button
										className="btn btn-sm btn-gray"
										onClick={() => {
											const contentTokensUpdated = recalcPercents(contentTokens);
											setContentTokens(contentTokensUpdated);
										}}
									>Divide percents evenly</button>
								</div>
							</div>
						) : null
					}

					{ getDistributionAlert() }
					{ getSwapErrorsAlert() }

				</div>

				<div className="c-wrap__table contenttokenstable mt-3">
					{
						contentTokens
							.sort((item, prev) => {

								// if ( item.address < prev.address ) { return -1 }
								// if ( item.address > prev.address ) { return  1 }

								if ( !item.timeAdded ) {
									return -1
								}
								if ( !prev.timeAdded ) {
									return 1
								}
								if ( item.timeAdded < prev.timeAdded ) { return -1 }
								if ( item.timeAdded > prev.timeAdded ) { return  1 }

								return 0;

							})
							.map((item, idx) => { return getContentTokensRow(item, idx + 1) })
					}
				</div>

				<div className="text-right mt-2">
					<b>{ contentTokens.length }</b> / <span className="text-muted">{ MAX_CONTENT_TOKENS } assets</span>
				</div>

			</div>
		)
	}

	const swapSubmit = async (_currentChain: ChainType, _web3: Web3, _userAddress: string, isMultisig?: boolean) => {

	// 	if ( odosRouterAddress === '' ) {
	// 		setModal({
	// 			type: _ModalTypes.error,
	// 			title: `Cannot fetch router address`,
	// 			text: [{ text: 'Try to change geolocation' }],
	// 			details: [
	// 				`Stage: preparetx_swap`,
	// 				`User address: ${_userAddress}`,
	// 				`Wallet address: ${walletToUse}`,
	// 				// `Smart wallet balances: ${JSON.stringify(ERC20Balances.filter((item) => { return item.walletAddress.toLowerCase() === walletToUse.toLowerCase() }))}`,
	// 				`Content tokens: ${JSON.stringify(contentTokens)}`,
	// 			]
	// 		});
	// 		return;
	// 	}

	// 	createAdvancedLoaderCreate(_currentChain, _web3, _userAddress);

	// 	const initialBalances: Array<ERC20Balance> = ERC20Balances
	// 		.filter((item) => { return item.walletAddress.toLowerCase() === walletToUse.toLowerCase() })
	// 		.map((item) => { return item.balance })

	// 	try { await transferCheckoutTokensToMaster(_currentChain, _web3, _userAddress, isMultisig); } catch(ignored) { return; }

	// 	let txBatch: Array<{ target: Array<string>, value: Array<string>, data: Array<string> }> = [];
	// 	try {
	// 		const approveTx = await preparetx_approve(_currentChain, _web3, _userAddress, isMultisig);
	// 		if ( approveTx ) { txBatch.push(approveTx) }
	// 	} catch (ignored) { return; }
	// 	try {
	// 		const createIndexTx = await preparetx_createindex(_currentChain, _web3, _userAddress, isMultisig);
	// 		txBatch.push(createIndexTx)
	// 	} catch (ignored) { return; }

	// 	try {
	// 		const swapTx = await preparetx_swap(_currentChain, _web3, _userAddress, isMultisig);
	// 		txBatch = [
	// 			...txBatch,
	// 			...swapTx
	// 		]
	// 	} catch (ignored) { return; }

	// 	let createAndSwapResp: any;
	// 	try {
	// 		createAndSwapResp = await executeTxs_create(txBatch, _currentChain, _web3, _userAddress, isMultisig);
	// 		console.log('createAndSwapResp', createAndSwapResp);
	// 	} catch (ignored) { return; }

	// 	let txBatchTransfer: Array<{ target: Array<string>, value: Array<string>, data: Array<string> }> = [];
	// 	try {
	// 		const transferTx = await preparetx_transfer(createAndSwapResp, initialBalances, _currentChain, _web3, _userAddress, isMultisig);
	// 		txBatchTransfer = [
	// 			...txBatchTransfer,
	// 			...transferTx
	// 		]
	// 	} catch (e: any) {
	// 		console.log('Cannot prepare transfer', e);
	// 		return;
	// 	}

	// 	let transferResp: any;
	// 	try {
	// 		transferResp = await executeTxs_transfer(txBatchTransfer, _currentChain, _web3, _userAddress, isMultisig)
	// 		console.log('transferResp', transferResp);
	// 	} catch (e: any) {
	// 		console.log('Cannot execute transfer', e);
	// 		return;
	// 	}

	// 	updateAllBalances(_userAddress);
	// 	updateAllBalances(walletToUse);

	// 	let indexLinks: Array<Array<{ text: string, url : string }>> = [];
	// 	const eventInit = await getEventFromTx(_currentChain.chainId, createAndSwapResp, 'initialized', WNFTV2IndexAddress, 'wnftv2index');
	// 	if ( eventInit ) {
	// 		indexLinks = eventInit.map((item) => {
	// 			return [{
	// 				text: `View index ${compactString(item.address)}/1`, url: `https://${window.location.hostname}/token/${_currentChain.chainId}/${item.address}/1`
	// 			}]
	// 		})
	// 	}

	// 	unsetModal();

	// 	setModal({
	// 		type: _ModalTypes.success,
	// 		title: `Transactions have been executed`,
	// 		buttons: [{
	// 			text: 'Ok',
	// 			clickFunc: () => {
	// 				unsetModal();
	// 			}
	// 		}],
	// 		text: (
	// 			<p>To see all your indexes go to <a href="/dashboard" target="_blank" rel="noopener noreferrer">dashboard</a></p>
	// 		),
	// 		links: [
	// 			{
	// 				text: `View swap tx on ${_currentChain.explorerName}`,
	// 				url: combineURLs(_currentChain.explorerBaseUrl, `/tx/${createAndSwapResp?.transactionHash}`)
	// 			},
	// 			{
	// 				text: `View transfer tx on ${_currentChain.explorerName}`,
	// 				url: combineURLs(_currentChain.explorerBaseUrl, `/tx/${transferResp?.transactionHash}`)
	// 			},
	// 		],
	// 		linkGroups: indexLinks
	// 	});
	}
	const getSubmitBtn = () => {

		const isSubmitDisabled = () => {
			if (
				walletToUse === '' ||
				inputCheckoutTokenAddress === '' ||
				inputCheckoutTokenAmount === '' ||
				swapError !== '' ||
				!isDistributionSumEquals100(contentTokens)
			) {
				return true;
			}

			const foundNoCovertedValue = contentTokens.find((item) => { return !item.convertedValue });
			if ( foundNoCovertedValue ) { return true; }
		}

		if ( isSubmitDisabled() ) {
			return (
				<button
					className={`btn btn-lg w-100 disabled`}
					onClick={async () => {
						setShowError(true);
						setTimeout(() => { setShowError(false); }, 5*1000)

						if ( walletToUse === '' ) { (walletBlockRef.current as any).scrollIntoView(); }
						if (
							inputCheckoutTokenAddress === '' ||
							inputCheckoutTokenAmount === ''
						) {
							(checkoutTokenBlockRef.current as any).scrollIntoView();
						}
					}}
				>Create</button>
			)
		}

		return (
			<button
				className={`btn btn-lg w-100 ${isSubmitDisabled() ? 'disabled' : ''}`}
				onClick={async () => {

					if (
						walletToUse === '' ||
						inputCheckoutTokenAddress === '' ||
						inputCheckoutTokenAmount === '' ||
						!contentTokens.length ||
						swapError !== ''
					) {
						setShowError(true);
						setTimeout(() => { setShowError(false); }, 5*1000)

						if ( walletToUse === '' ) { (walletBlockRef.current as any).scrollIntoView(); }
						if (
							inputCheckoutTokenAddress === '' ||
							inputCheckoutTokenAmount === ''
						) {
							(checkoutTokenBlockRef.current as any).scrollIntoView();
						}

						return;
					}

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
					const isMultisig = localStorageGet('authMethod').toLowerCase() === 'safe';
					swapSubmit(_currentChain, _web3, _userAddress, isMultisig);
				}}
			>Swap</button>
		)
	}

	return (
		<main className="s-main">
		<div className="container" ref={ walletBlockRef }>

			<SmartWalletSelector
				onWalletSelect={(wallet) => {
					console.log('wallet selected', wallet);
					setWalletToUse(wallet);
				}}
				showError={ showError && walletToUse === '' }
				callbackAfterCreate={(wallets, created) => {
					if ( !wallets.length ) {
						setInfo(
							'To create indexes:',
							[
								'1. Define the underlying asset and the amount  to use to create an indexes',
								'2. Fill in the count of indexes to create',
								'3. Collect list of the assets with the proportions which indexes will have inside',
								'4. Press Create button and sign the transaction',
							]
						)
					}
				}}
			/>

			{ getCheckoutSumBlock() }
			{ getContentTokensBlock() }

			{ getSubmitBtn() }

		</div>
		</main>
	)
}