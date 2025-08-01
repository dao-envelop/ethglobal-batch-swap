import React, {
	useContext,
	useEffect,
	useRef,
	useState
} from "react";

import {
	_AdvancedLoadingStatus,
	_ModalTypes,
	AdvancedLoaderStageType,
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
	removeThousandSeparator,
	tokenToFloat,
	tokenToInt,
	transferERC20,
	transferNativeTokens,
	Web3
} from "@envelop/envelop-client-core";

import SmartWalletSelector from "../SmartWalletSelector";
import TippyWrapper from "../TippyWrapper";
import CoinSelector from "../CoinSelector";

import icon_i_del   from '../../static/pics/i-del.svg';
import icon_loading from '../../static/pics/loading.svg';;

import config       from '../../app.config.json';
import {
	fetchAllowanceForToken,
	fetchBalanceForToken,
	getApprovalDataForToken,
	getRouterAddress,
	getSwapDataForToken,
} from "../../utils/oneinch";
import {
	getSmartWalletBalances
} from "../../utils/smartwallets";
import InputWithOptions from "../InputWithOptions";

type ContentTokenRowType = {
	address: string,
	percent: string,
	timeAdded?: number,
	convertedValue?: BigNumber,
	status?: string,
}

export default function BatchSwap() {

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
	const [ userTokens,                      setUserTokens                      ] = useState<Array<{ walletAddress: string, tokenAddress: string, amount: BigNumber }>>([]);

	const [ inputContentTokenAddress,        setInputContentTokenAddress        ] = useState('');
	const [ contentTokens,                   setContentTokens                   ] = useState<Array<ContentTokenRowType>>([]);

	const [ swapRouterAddress,               setSwapRouterAddress               ] = useState('');
	const [ swapError,                       setSwapError                       ] = useState('');

	const [ showError,                       setShowError                       ] = useState(false);

	useEffect(() => {

		if ( !currentChain ) { return; }

		try {
			const foundChain = config.CHAIN_SPECIFIC_DATA.find((item) => { return item.chainId === currentChain.chainId });
			if ( foundChain ) { setSupportedCheckoutTokens(foundChain.checkoutTokens); }
		} catch(e) {
			console.log('Cannot load params', e);
		}

		getRouterAddress(currentChain.chainId)
			.then((data) => { setSwapRouterAddress(data) })
			.catch(() => { setSwapRouterAddress('') })

	}, [ currentChain ]);
	useEffect(() => {

		if ( !currentChain ) { return; }
		if ( !userAddress ) { return; }

		getSmartWalletBalances(currentChain.chainId, userAddress)
			.then((data) => { setUserTokens(data) })
			.catch(() => { setUserTokens([]) })

	}, [ currentChain, userAddress ]);

	const getCheckoutSumBlock = () => {

		if ( !currentChain ) { return null; }

		const tokensToRender = userTokens.map((item) => {
			if ( currentChain && item.tokenAddress === '0x0000000000000000000000000000000000000000' ) { return chainTypeToERC20(currentChain); }
			const foundERC20 = erc20List.find((iitem) => { return iitem.contractAddress.toLowerCase() === item.tokenAddress.toLowerCase() });
			if ( !foundERC20 ) {
				requestERC20Token(item.tokenAddress);
				return getNullERC20(item.tokenAddress);
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
						<div className="input-group mb-3">
							<label className="input-label">
								Select API to swap
							</label>
							<InputWithOptions
								value={ 'Classic swap' }
								placeholder="Select API to swap"
								onSelect={(e) => {
								}}
								options={
									[
										{
											label: 'Classic swap',
											value: 'Classic swap',
										},
										{
											label: 'Fusion',
											value: 'Fusion',
											badge: 'Under construction',
										},
										{
											label: 'Fusion+',
											value: 'Fusion+',
											badge: 'Under construction',
										},
									]
								}
								showArrow={ true }
							/>
						</div>
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
		const zeroPercent =_contentTokens.find((item) => { return new BigNumber(item.percent).eq(0) });
		if ( zeroPercent ) { return false; }

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
	const filterERC20List = (): Array<ERC20Type> => {
		const output = supportedCheckoutTokens.map((item) => {
			if ( currentChain && item === '0x0000000000000000000000000000000000000000' ) { return chainTypeToERC20(currentChain); }

			let foundERC20 = erc20List.find((iitem) => { return item.toLowerCase() === iitem.contractAddress.toLowerCase() });
			if ( !foundERC20 ) {
				requestERC20Token(item);
				foundERC20 = getNullERC20(item);
			}
			return foundERC20;
		});

		return output;
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
									tokens        = { filterERC20List() }
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

			</div>
		)
	}

	const createAdvancedLoaderCreate = (_currentChain: ChainType, _web3: Web3, _userAddress: string) => {

		const loaderStages: Array<AdvancedLoaderStageType> = []

		loaderStages.push({
			id: 'transfertomaster',
			sortOrder: 10,
			text: 'Transferring tokens to smart wallet',
			status: _AdvancedLoadingStatus.queued
		});

		loaderStages.push({
			id: 'preparetx_approve',
			sortOrder: 20,
			text: 'Approve source token',
			status: _AdvancedLoadingStatus.queued
		});

		loaderStages.push({
			id: 'preparetx_swap',
			sortOrder: 30,
			text: 'Prepare batch of txs: swap tokens',
			total: contentTokens.length,
			status: _AdvancedLoadingStatus.queued
		});
		loaderStages.push({
			id: 'executetx_swap',
			sortOrder: 31,
			text: `Executing batch of swaps`,
			status: _AdvancedLoadingStatus.queued
		});

		const advLoader = {
			title: 'Waiting to swap',
			stages: loaderStages
		};
		createAdvancedLoader(advLoader);

	}
	const transferCheckoutTokensToMaster = async (_currentChain: ChainType, _web3: Web3, _userAddress: string, isMultisig?: boolean) => {

		if ( inputCheckoutTokenAmount === '' || inputCheckoutTokenAmount === '0' ) {
			throw new Error('Empty amount')
		}

		let foundCheckoutERC20 = erc20List.find((item) => { return item.contractAddress.toLowerCase() === inputCheckoutTokenAddress.toLowerCase() });
		if ( !foundCheckoutERC20 ) {
			foundCheckoutERC20 = getNullERC20(inputCheckoutTokenAddress);
		}

		if ( inputCheckoutTokenAddress === '0x0000000000000000000000000000000000000000' ) {

			updateStepAdvancedLoader({
				id: 'transfertomaster',
				status: _AdvancedLoadingStatus.loading,
				text: `Transferring ${ _currentChain.symbol } to smart wallet`,
			});

			const amountToCheck = tokenToInt(new BigNumber(inputCheckoutTokenAmount), _currentChain.decimals);
			const walletBalance = await fetchBalanceForToken(_currentChain.chainId, inputCheckoutTokenAddress, walletToUse);
			const amountDiff = amountToCheck.minus(walletBalance);

			if ( amountDiff.gt(0) ) {
				const userBalance = await fetchBalanceForToken(_currentChain.chainId, inputCheckoutTokenAddress, _userAddress);
				if ( userBalance.lt(amountDiff) ) {
					setModal({
						type: _ModalTypes.error,
						title: `Not enough ${_currentChain.symbol}`,
						details: [
							`Stage: transferCheckoutTokensToMaster`,
							`Token ${_currentChain.symbol}: ${inputCheckoutTokenAddress}`,
							`User address: ${_userAddress}`,
							`Wallet address: ${walletToUse}`,
							`Amount to send: ${tokenToFloat(amountToCheck, _currentChain.decimals).toString()} (${amountToCheck})`,
							`Balance diff: ${tokenToFloat(amountDiff, _currentChain.decimals).toString()} (${amountDiff})`,
							`User balance: ${tokenToFloat(userBalance, _currentChain.decimals).toString()} (${userBalance})`,
							`Smart wallet balance: ${tokenToFloat(walletBalance, _currentChain.decimals).toString()} (${walletBalance})`,
						]
					});
					throw new Error();
				}

				try {
					await transferNativeTokens(_web3, _userAddress, amountDiff, walletToUse);
				} catch(e: any) {
					setModal({
						type: _ModalTypes.error,
						title: `Cannot transfer ${_currentChain.symbol}`,
						details: [
							`Stage: transferCheckoutTokensToMaster`,
							`Token ${_currentChain.symbol}: ${inputCheckoutTokenAddress}`,
							`User address: ${_userAddress}`,
							`Wallet address: ${walletToUse}`,
							`Amount to send: ${tokenToFloat(amountToCheck, _currentChain.decimals).toString()} (${amountToCheck})`,
							`Balance diff: ${tokenToFloat(amountDiff, _currentChain.decimals).toString()} (${amountDiff})`,
							`User balance: ${tokenToFloat(userBalance, _currentChain.decimals).toString()} (${userBalance})`,
							`Smart wallet balance: ${tokenToFloat(walletBalance, _currentChain.decimals).toString()} (${walletBalance})`,
							'',
							e.message || e,
						]
					});
					throw new Error();
				}

			}

		} else {
			let foundToken = erc20List.find((item) => { return item.contractAddress.toLowerCase() === inputCheckoutTokenAddress.toLowerCase() });
			if ( !foundToken ) {
				foundToken = getNullERC20(inputCheckoutTokenAddress);
			}

			updateStepAdvancedLoader({
				id: 'transfertomaster',
				status: _AdvancedLoadingStatus.loading,
				text: `Transferring ${ foundToken.symbol } to smart wallet`,
			});

			const amountToCheck = tokenToInt(new BigNumber(inputCheckoutTokenAmount), foundToken.decimals);
			const walletBalance = await fetchBalanceForToken(_currentChain.chainId, inputCheckoutTokenAddress, walletToUse);
			const amountDiff = amountToCheck.minus(walletBalance);

			if ( amountDiff.gt(0) ) {
				const userBalance = await fetchBalanceForToken(_currentChain.chainId, inputCheckoutTokenAddress, _userAddress);
				if ( userBalance.lt(amountDiff) ) {
					setModal({
						type: _ModalTypes.error,
						title: `Not enough ${foundToken.symbol}`,
						details: [
							`Stage: transferCheckoutTokensToMaster`,
							`Token ${foundToken.symbol}: ${inputCheckoutTokenAddress}`,
							`User address: ${_userAddress}`,
							`Wallet address: ${walletToUse}`,
							`Amount to send: ${tokenToFloat(amountToCheck, foundToken.decimals).toString()} (${amountToCheck})`,
							`Balance diff: ${tokenToFloat(amountDiff, foundToken.decimals).toString()} (${amountDiff})`,
							`User balance: ${tokenToFloat(userBalance, foundToken.decimals).toString()} (${userBalance})`,
							`Smart wallet balance: ${tokenToFloat(walletBalance, foundToken.decimals).toString()} (${walletBalance})`,
						]
					});
					throw new Error();
				}

				try {
					await transferERC20(_web3, inputCheckoutTokenAddress, _userAddress, amountDiff, walletToUse);
				} catch(e: any) {
					setModal({
						type: _ModalTypes.error,
						title: `Cannot transfer ${foundToken.symbol}`,
						details: [
							`Stage: transferCheckoutTokensToMaster`,
							`Token ${foundToken.symbol}: ${inputCheckoutTokenAddress}`,
							`User address: ${_userAddress}`,
							`Wallet address: ${walletToUse}`,
							`Amount to send: ${tokenToFloat(amountToCheck, foundToken.decimals).toString()} (${amountToCheck})`,
							`Balance diff: ${tokenToFloat(amountDiff, foundToken.decimals).toString()} (${amountDiff})`,
							`User balance: ${tokenToFloat(userBalance, foundToken.decimals).toString()} (${userBalance})`,
							`Smart wallet balance: ${tokenToFloat(walletBalance, foundToken.decimals).toString()} (${walletBalance})`,
							'',
							e.message || e,
						]
					});
					throw new Error();
				}

			}
		}

		updateStepAdvancedLoader({
			id: 'transfertomaster',
			status: _AdvancedLoadingStatus.complete
		});

	}
	const preparetx_approve = async (_currentChain: ChainType, _web3: Web3, _userAddress: string) => {

		if ( inputCheckoutTokenAddress === '0x0000000000000000000000000000000000000000' ) {
			updateStepAdvancedLoader({
				id: 'preparetx_approve',
				status: _AdvancedLoadingStatus.complete,
			});
			return;
		}
		updateStepAdvancedLoader({
			id: 'preparetx_approve',
			status: _AdvancedLoadingStatus.loading,
		});

		let foundCheckoutERC20 = erc20List.find((item) => { return item.contractAddress.toLowerCase() === inputCheckoutTokenAddress.toLowerCase() });
		if ( !foundCheckoutERC20 ) {
			foundCheckoutERC20 = getNullERC20(inputCheckoutTokenAddress);
		}

		let approveTx;
		const amountToCheck = tokenToInt(new BigNumber(inputCheckoutTokenAmount), foundCheckoutERC20.decimals);

		try {
			const allowance = await fetchAllowanceForToken(_currentChain.chainId, inputCheckoutTokenAddress, walletToUse);
			if ( allowance.lt(amountToCheck) ) {
				approveTx = await getApprovalDataForToken(_currentChain.chainId, inputCheckoutTokenAddress, amountToCheck);
			}
		} catch(e: any) {
			setModal({
				type: _ModalTypes.error,
				title: `Cannot get approve calldata for ${foundCheckoutERC20.symbol}`,
				details: [
					`Stage: preparetx_approve`,
					`Token ${foundCheckoutERC20.symbol}: ${foundCheckoutERC20.contractAddress}`,
					`User address: ${_userAddress}`,
					`Wallet address: ${walletToUse}`,
					`Error: ${e}`
				]
			});
			throw new Error();
		}

		updateStepAdvancedLoader({
			id: 'preparetx_approve',
			status: _AdvancedLoadingStatus.complete
		});

		return {
			target: [ inputCheckoutTokenAddress ],
			data: [ approveTx.data ],
			value: [ approveTx.value ],
		}
	}
	const preparetx_swap = async (_currentChain: ChainType, _web3: Web3, _userAddress: string) => {

		updateStepAdvancedLoader({
			id: 'preparetx_swap',
			status: _AdvancedLoadingStatus.loading,
		});

		let txs: Array<{ target: Array<string>, value: Array<string>, data: Array<string> }> = [];
		let foundCheckoutERC20 = erc20List.find((item) => { return item.contractAddress.toLowerCase() === inputCheckoutTokenAddress.toLowerCase() });
		if ( !foundCheckoutERC20 ) {
			foundCheckoutERC20 = getNullERC20(inputCheckoutTokenAddress);
		}
		const checkoutAmountParsed = tokenToInt(new BigNumber(inputCheckoutTokenAmount), foundCheckoutERC20.decimals);

		for (let idx = 0; idx < contentTokens.length; idx++) {
			const item = contentTokens[idx];

			let foundERC20 = erc20List.find((iitem) => { return iitem.contractAddress.toLowerCase() === item.address.toLowerCase() });
			if ( !foundERC20 ) {
				foundERC20 = getNullERC20(item.address);
			}

			updateStepAdvancedLoader({
				id: 'preparetx_swap',
				text: `Approve source token. Prepare tx for (${foundERC20.symbol})`,
				status: _AdvancedLoadingStatus.loading,
				current: idx+1,
			});

			const percentParsed = new BigNumber(item.percent).dividedBy(100);
			const amountToCheck = checkoutAmountParsed.multipliedBy(percentParsed);

			try {
				const tx = await getSwapDataForToken(_currentChain.chainId, inputCheckoutTokenAddress, item.address, amountToCheck, walletToUse);
				if ( tx ) {
					txs.push({
						target: [ swapRouterAddress ],
						value: [ tx.tx.value ],
						data: [ tx.tx.data ],
					});
				}
			} catch(e: any) {
				setModal({
					type: _ModalTypes.error,
					title: `Cannot get swap calldata for ${foundCheckoutERC20.symbol}`,
					details: [
						`Stage: preparetx_swap`,
						`Token ${foundCheckoutERC20.symbol}: ${foundCheckoutERC20.contractAddress}`,
						`User address: ${_userAddress}`,
						`Wallet address: ${walletToUse}`,
						`Error: ${e}`
					]
				});
				throw new Error();
			}

		}

		updateStepAdvancedLoader({
			id: 'preparetx_swap',
			text: `Approve source token. Prepare tx`,
			status: _AdvancedLoadingStatus.complete,
			current: contentTokens.length,
		});

		return txs;
	}
	const executeTxs_swap = async (txs: Array<{ target: Array<string>, value: Array<string>, data: Array<string> }>, _currentChain: ChainType, _web3: Web3, _userAddress: string) => {

		updateStepAdvancedLoader({
			id: 'executetx_swap',
			status: _AdvancedLoadingStatus.loading,
		});

		let txResp: any;
		try {
			const abi = require(`../../abis/smartwallet.json`);
			const contract = new _web3.eth.Contract(abi as any, walletToUse);

			const argTargets = txs.map((item) => { return item.target.flat() }).flat();
			console.log('argTargets', argTargets);
			const argValues = txs.map((item) => { return item.value.flat() }).flat();
			console.log('argValues', argValues);
			const argDatas = txs.map((item) => { return item.data.flat() }).flat();
			console.log('argDatas', argDatas);

			const tx = await contract.methods.executeEncodedTxBatch(
				argTargets,
				argValues,
				argDatas,
			);

			// try {
			// 	await tx.estimateGas({ from: userAddress })
			// } catch(e) {
			// 	throw e;
			// }

			txResp = await tx.send({ from: userAddress, maxPriorityFeePerGas: null, maxFeePerGas: null });

		} catch(e: any) {
			setModal({
				type: _ModalTypes.error,
				title: `Cannot create index`,
				details: [
					`Stage: executeTxs_create`,
					`User address: ${_userAddress}`,
					`Wallet address: ${walletToUse}`,
					'',
					e.message || e,
				]
			});
			throw new Error();
		}

		updateStepAdvancedLoader({
			id: 'executetx_swap',
			status: _AdvancedLoadingStatus.complete
		});

		return txResp;
	}
	const swapSubmit = async (_currentChain: ChainType, _web3: Web3, _userAddress: string) => {

		if ( swapRouterAddress === '' ) {
			setModal({
				type: _ModalTypes.error,
				title: `Cannot fetch router address`,
				details: [
					`Stage: preparetx_swap`,
					`User address: ${_userAddress}`,
					`Wallet address: ${walletToUse}`,
					`Content tokens: ${JSON.stringify(contentTokens)}`,
				]
			});
			return;
		}

		createAdvancedLoaderCreate(_currentChain, _web3, _userAddress);

		let txBatch: Array<{ target: Array<string>, value: Array<string>, data: Array<string> }> = [];

		try { await transferCheckoutTokensToMaster(_currentChain, _web3, _userAddress); } catch(ignored) { return; }
		try {
			const approveTx = await preparetx_approve(_currentChain, _web3, _userAddress);
			if ( approveTx ) {
				txBatch = [
					...txBatch,
					approveTx
				]
			}
		} catch (ignored) { return; }
		try {
			const swapTx = await preparetx_swap(_currentChain, _web3, _userAddress);
			txBatch = [
				...txBatch,
				...swapTx
			]
		} catch (ignored) { return; }

		let swapResp: any;
		try {
			swapResp = await executeTxs_swap(txBatch, _currentChain, _web3, _userAddress);
			console.log('swapResp', swapResp);
		} catch (ignored) { return; }

		updateAllBalances(_userAddress);

		unsetModal();

		setModal({
			type: _ModalTypes.success,
			title: `Transactions have been executed`,
			buttons: [{
				text: 'Ok',
				clickFunc: () => {
					unsetModal();
				}
			}],
			links: [
				{
					text: `View swap tx on ${_currentChain.explorerName}`,
					url: combineURLs(_currentChain.explorerBaseUrl, `/tx/${swapResp?.transactionHash}`)
				},
			],
		});
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
			return false;
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
				>Swap</button>
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
					swapSubmit(_currentChain, _web3, _userAddress);
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
			/>

			{ getCheckoutSumBlock() }
			{ getContentTokensBlock() }

			{ getSubmitBtn() }

		</div>
		</main>
	)
}