
import React, {
	useContext,
	useState
} from 'react';
import TippyWrapper from '../../components/TippyWrapper';
import { Web3Context } from '../Web3Dispatcher';
import {
	AdvancedLoaderStageType,
	InfoModalContext,
	_AdvancedLoadingStatus,
	_ModalTypes
} from '../InfoModalDispatcher';
import {
	BigNumber,
	buySubscription,
	buySubscriptionMultisig,
	combineURLs,
	compactString,
	convertRemainingTimeToStr,
	getERC20BalanceFromChain,
	getNativeBalance,
	getPriceWithFee,
	localStorageGet,
	makeERC20Allowance,
	makeERC20AllowanceMultisig,
	tokenToFloat
} from '@envelop/envelop-client-core';

import default_icon from '@envelop/envelop-client-core/static/pics/coins/_default.svg';
import { SubscriptionContext } from './subscriptiondispatcher';
import { ERC20Context } from '../ERC20Dispatcher';
import InputWithOptions from '../../components/InputWithOptions';

type SubscriptionPopupProps = {
	closePopup: () => void,
}

export default function SubscriptionPopup(props: SubscriptionPopupProps) {

	const { closePopup } = props;
	const {
		TX_names,
		registryContract,
		agentContract,
		serviceContract,
		updateTicket
	} = useContext(SubscriptionContext);

	const {
		web3,
		currentChain,
		currentChainId,
		userAddress,
	} = useContext(Web3Context);
	const {
		createAdvancedLoader,
		updateStepAdvancedLoader,
		setError,
		setModal,
	} = useContext(InfoModalContext);
	const {
		subscriptionRemainings,
		subscriptionTariffs
	} = useContext(SubscriptionContext);
	const {
		erc20List,
	} = useContext(ERC20Context);

	const [ buyFor, setBuyFor                                                   ] = useState('');
	const [ subscriptionPaymentTypeSelected, setSubscriptionPaymentTypeSelected ] = useState('');
	const [ subscriptionTypeSelected, setSubscriptionTypeSelected               ] = useState('');
	const [ subscriptionTariffSelectedIdx, setSubscriptionTariffSelectedIdx     ] = useState(-1);
	const [ subscriptionTokenSelected, setSubscriptionTokenSelected             ] = useState('');
	const [ recieverEdited, setRecieverEdited                                   ] = useState(false);

	const [ priceWithFee, setPriceWithFee                                       ] = useState<BigNumber | undefined>(undefined)

	const getPaymentToken = (address: string) => {
		if ( !currentChain ) { return undefined; }
		if ( !currentChainId ) { return undefined; }
		if ( !userAddress ) { return undefined; }

		if ( address === '0x0000000000000000000000000000000000000000' ) {

			const balanceNative = getNativeBalance(currentChainId, userAddress);

			return {
				name: currentChain.name,
				symbol: currentChain.symbol,
				decimals: currentChain.decimals,
				balance: balanceNative,
				allowance: new BigNumber(0),
				icon: currentChain.networkIcon || default_icon,
				permissions: {}
			}
		}
		const foundToken = erc20List.find((item) => { return item.contractAddress.toLowerCase() === address.toLowerCase() });
		if ( !foundToken ) {
			return undefined;
		}

		return foundToken;
	}
	const getTicketDetails = () => {
		if ( subscriptionTariffSelectedIdx === -1 ) { return null; }

		const foundTicket = subscriptionTariffs.find((item) => { return item.idx === subscriptionTariffSelectedIdx });
		if ( !foundTicket ) { return null; }

		let fullPriceStr = undefined;
		const foundPayOption = foundTicket.payWith.find((item) => { return subscriptionTokenSelected.toLowerCase() === item.paymentToken.toLowerCase() })
		if ( foundPayOption ) {
			const payToken = getPaymentToken(foundPayOption.paymentToken);
			const symbolParsed = payToken ? payToken.symbol : foundPayOption.paymentToken;

			const decimalsParsed = payToken ? payToken.decimals : 18;
			if ( priceWithFee ) {
				fullPriceStr = `${tokenToFloat(priceWithFee, decimalsParsed)} ${symbolParsed}`
			}
		}

		return (
			<React.Fragment>
			{
				!foundTicket.subscription.timelockPeriod.eq(0) ? (
					<p className="mt-0">
						Lock time:
						<br />
						<b className="text-green">
							{ convertRemainingTimeToStr(foundTicket.subscription.timelockPeriod) }
							<TippyWrapper
								msg='Time to lock your collateral tokens'
								elClass='ml-1'
							/>
						</b>
					</p>
				) : null
			}
			{
				!foundTicket.subscription.ticketValidPeriod.eq(0) ? (
					<p className="mt-0">
						Subscription time:
						<br />
						<b className="text-green">
							{ convertRemainingTimeToStr(foundTicket.subscription.ticketValidPeriod) }
							<TippyWrapper
								msg='The period of time during which the subscription is valid. There is no limit on the number of times the service can be used.'
								elClass='ml-1'
							/>
						</b>
					</p>
				) : null
			}
			{
				parseInt(`${foundTicket.subscription.counter}`) !== 0 ? (
					<p className="mt-0">
						{ TX_names.plural.replace(/\w\S*/g, (txt) => { return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase() }) } count:
						<b className="text-green">
							{ ' ' }
							{ foundTicket.subscription.counter }
							<TippyWrapper
								msg='The number of calls to the service according to the price plan. There is no time limit.'
								elClass='ml-1'
							/>
						</b>
					</p>
				) : null
			}
			{
				fullPriceStr ? (
					<p className="mt-0">
						Price:
						<br />
						<b className="text-green">
							{ fullPriceStr }
							<TippyWrapper
								msg={ subscriptionPaymentTypeSelected === 'timelock' ? 'Number of collateral tokens that will be locked.' : 'Price with fee' }
								elClass='ml-1'
							/>
						</b>
					</p>
				) : null
			}
			</React.Fragment>
		)
	}
	const getPaymentTypeSelect = () => {

		const subscriptionsFilteredTimelock = subscriptionTariffs.filter((item) => { return !item.subscription.timelockPeriod.eq(0) })
		const subscriptionsFilteredBuy = subscriptionTariffs.filter((item) => { return item.subscription.timelockPeriod.eq(0) })

		const optionsToRender = [];
		if ( subscriptionsFilteredTimelock.length ) { optionsToRender.push({ label: 'Token deposit', value: 'timelock', description: 'Buy via lock tokens' }) }
		if ( subscriptionsFilteredBuy.length ) { optionsToRender.push({ label: 'Direct payment', value: 'buy', description: 'Subscription by transferring native coins or erc20 tokens' }) }

		return (
			<div className="input-group">
				<label className="input-label">Payment type</label>
				<InputWithOptions
					value={ subscriptionPaymentTypeSelected }
					placeholder='Select payment type'
					onSelect={(e) => {

						setSubscriptionPaymentTypeSelected(e.value);
						setSubscriptionTypeSelected('');
						setSubscriptionTariffSelectedIdx(-1);
						setSubscriptionTokenSelected('');
						setPriceWithFee(undefined);

						return;
					}}
					options={optionsToRender}
					showArrow={ true }
				/>
			</div>
		)
	}
	const getSubscriptionTypeSelect = () => {
		if ( subscriptionPaymentTypeSelected === '' ) { return null; }

		const subscriptionsFilteredTime = subscriptionTariffs
			.filter((item) => {
				if ( subscriptionPaymentTypeSelected === 'timelock' ) {
					return !item.subscription.timelockPeriod.eq(0)
				} else {
					return item.subscription.timelockPeriod.eq(0)
				}
			})
			.filter((item) => {
				return parseInt(`${item.subscription.counter}`) === 0
			});
		const subscriptionsFilteredTX = subscriptionTariffs
			.filter((item) => {
				if ( subscriptionPaymentTypeSelected === 'timelock' ) {
					return !item.subscription.timelockPeriod.eq(0)
				} else {
					return item.subscription.timelockPeriod.eq(0)
				}
			})
			.filter((item) => {
				return parseInt(`${item.subscription.counter}`) !== 0
			});

		const optionsToRender = [];
		if ( subscriptionsFilteredTime.length ) { optionsToRender.push({ label: 'Time subscription', value: 'time' }) }
		if ( subscriptionsFilteredTX.length ) { optionsToRender.push({ label: 'Uses subscription', value: 'txs' }) }

		return (
			<div className="input-group">
				<label className="input-label">Subscription type</label>
				<InputWithOptions
					value={ subscriptionTypeSelected }
					placeholder='Select subscription type'
					onSelect={(e) => {

						setSubscriptionTypeSelected(e.value)
						setSubscriptionTariffSelectedIdx(-1)
						setSubscriptionTokenSelected('')
						setPriceWithFee(undefined)

						return;
					}}
					options={optionsToRender}
					showArrow={ true }
				/>
			</div>
		)
	}
	const getSubscriptionPlanSelect = () => {
		if ( subscriptionTypeSelected === '' ) { return null; }

		const subscriptionsFiltered = subscriptionTariffs
			.filter((item) => {
				if ( subscriptionPaymentTypeSelected === 'timelock' ) {
					return !item.subscription.timelockPeriod.eq(0)
				} else {
					return item.subscription.timelockPeriod.eq(0)
				}
			})
			.filter((item) => {
				if ( subscriptionTypeSelected === 'time' ) {
					return parseInt(`${item.subscription.counter}`) === 0
				} else {
					return parseInt(`${item.subscription.counter}`) !== 0
				}
			})
			.sort((item, prev) => {
				const itemCount = parseInt(`${item.subscription.counter}`);
				const prevCount = parseInt(`${prev.subscription.counter}`);
				if ( itemCount > 0 && prevCount > 0 ) {
					return itemCount - prevCount
				}
				if ( item.subscription.ticketValidPeriod.gt(0) && prev.subscription.ticketValidPeriod.gt(0) ) {
					return item.subscription.ticketValidPeriod.plus(-prev.subscription.ticketValidPeriod).toNumber()
				}

				return 0;
			})

		const optionsToRender = subscriptionsFiltered.map((item) => {

			const foundFreePlan = item.payWith.find((iitem) => { return iitem.paymentAmount.eq(0) })

			if ( parseInt(`${item.subscription.counter}`) !== 0 ) {
				return (
					{
						value: `${item.idx}`,
						label: `${ item.subscription.counter } ${ item.subscription.counter === 1 ? TX_names.singular : TX_names.plural }`,
						badge: foundFreePlan ? 'free' : undefined
					}
				)
			} else {
				return (
					{
						value: `${item.idx}`,
						label: `${ convertRemainingTimeToStr(item.subscription.ticketValidPeriod) }`,
						badge: foundFreePlan ? 'free' : undefined
					}
				)
			}
		})

		return (
			<div className="input-group">
				<label className="input-label">Subscription plan</label>
				<InputWithOptions
					value={ subscriptionTariffSelectedIdx === -1 ? '' : `${subscriptionTariffSelectedIdx}` }
					placeholder='Select subscription plan'
					onSelect={(e) => {

						if ( subscriptionTokenSelected !== '' ) {

							const tariffSelected = subscriptionTariffs.find((item) => { return item.idx === parseInt(e.value) });
							if ( !tariffSelected ) { return; }
							const payOptionSelected = tariffSelected.payWith.find((item) => { return item.paymentToken.toLowerCase() === subscriptionTokenSelected.toLowerCase() })
							if ( !payOptionSelected ) { return; }

							getPriceWithFee(
								currentChainId || 0,
								registryContract,
								serviceContract,
								tariffSelected.idx,
								payOptionSelected.idx,
							)
							.then((data) => {
								setPriceWithFee(data);
							});
						}

						setSubscriptionTariffSelectedIdx(parseInt(e.value));
						setPriceWithFee(undefined);

						return;
					}}
					options={optionsToRender}
					showArrow={ true }
				/>
			</div>
		)
	}
	const getSubscriptionTokenSelect = () => {
		if ( subscriptionTariffSelectedIdx === -1 ) { return null; }

		const subscriptionsFound = subscriptionTariffs
			.filter((item) => {
				if ( subscriptionPaymentTypeSelected === 'timelock' ) {
					return !item.subscription.timelockPeriod.eq(0)
				} else {
					return item.subscription.timelockPeriod.eq(0)
				}
			})
			.filter((item) => {
				if ( subscriptionTypeSelected === 'time' ) {
					return parseInt(`${item.subscription.counter}`) === 0
				} else {
					return parseInt(`${item.subscription.counter}`) !== 0
				}
			})
			.find((item) => { return item.idx === subscriptionTariffSelectedIdx });

		const optionsToRender = subscriptionsFound?.payWith.map((item) => {
			return {
				value: item.paymentToken,
				label: `${ getPaymentToken(item.paymentToken)?.symbol || compactString(item.paymentToken) }`
			}
		})

		return (
			<div className="input-group mb-0">
				<label className="input-label">Payment token</label>
				<InputWithOptions
					value={ subscriptionTokenSelected }
					placeholder='Select payment token'
					onSelect={(e) => {

						const tariffSelected = subscriptionTariffs.find((item) => { return item.idx === subscriptionTariffSelectedIdx });
						if ( !tariffSelected ) { return; }
						const payOptionSelected = tariffSelected.payWith.find((item) => { return item.paymentToken.toLowerCase() ===  e.value.toLowerCase() })
						if ( !payOptionSelected ) { return; }

						getPriceWithFee(
							currentChainId || 0,
							registryContract,
							serviceContract,
							tariffSelected.idx,
							payOptionSelected.idx,
						)
						.then((data) => {
							setPriceWithFee(data);
						});

						setSubscriptionTokenSelected(e.value);
						setPriceWithFee(undefined);
						return;
					}}
					options={optionsToRender}
					showArrow={ true }
				/>
			</div>
		)
	}
	const isSubmitDisabled = () => {
		if ( subscriptionTariffSelectedIdx === -1 ) { return true; }
		if ( subscriptionTokenSelected === '' ) { return true; }
		if ( subscriptionRemainings !== undefined ) {
			if ( buyFor === '' ) { return true; }
		}
		if ( recieverEdited ) {
			if ( buyFor === '' ) { return true; }
			return false;
		}

		return false
	}

	const isMeCheckboxChecked = () => {
		if ( subscriptionRemainings !== undefined ) { return false; }

		return !recieverEdited;
	}

	const buySubmit = async () => {

		if ( !web3 ) { return; }
		if ( !userAddress ) { return; }

		const isMultisig = localStorageGet('authMethod').toLowerCase() === 'safe';

		if ( subscriptionTariffSelectedIdx === -1 ) { return; }
		const receiver = buyFor !== '' ? buyFor : userAddress || '';

		const tariffSelected = subscriptionTariffs.find((item) => { return item.idx === subscriptionTariffSelectedIdx });
		if ( !tariffSelected ) { return; }
		const payOptionSelected = tariffSelected.payWith.find((item) => { return item.paymentToken.toLowerCase() === subscriptionTokenSelected.toLowerCase() })
		if ( !payOptionSelected ) { return; }
		const paymentTokenSymbol = getPaymentToken(payOptionSelected.paymentToken)?.symbol || compactString(payOptionSelected.paymentToken);

		const loaderStages: Array<AdvancedLoaderStageType> = [
			{
				id: 'approve',
				sortOrder: 1,
				text: `Approving ${paymentTokenSymbol}`,
				status: _AdvancedLoadingStatus.loading
			},
			{
				id: 'buy',
				sortOrder: 2,
				text: `Buying subscription`,
				status: _AdvancedLoadingStatus.queued
			},
		];
		const advLoader = {
			title: 'Waiting to buy subscription',
			stages: loaderStages
		};
		createAdvancedLoader(advLoader);

		const priceToPay = await getPriceWithFee(
			currentChainId,
			registryContract,
			serviceContract,
			tariffSelected.idx,
			payOptionSelected.idx
		);

		const balance = await getERC20BalanceFromChain(currentChainId, payOptionSelected.paymentToken, userAddress, registryContract);
		if ( balance.balance.lt(priceToPay) ) {
			setModal({
				type: _ModalTypes.error,
				title: `Not enoungh ${paymentTokenSymbol}`,
				details: [
					`User address: ${userAddress}`,
					`Payment token: ${paymentTokenSymbol} ${payOptionSelected.paymentToken}`,
					`Subscription price with fee: ${priceToPay}`,
					`Balance: ${balance.balance.toString()}`,
					`Allowance for registry (${registryContract}): ${balance.allowance?.amount.toString()}`,
					`Agent: ${agentContract}`,
					`Service: ${serviceContract}`,
				]
			});
			return;
		}
		if ( balance.allowance?.amount.lt(priceToPay) ) {
			try {
				if ( isMultisig ) {
					await makeERC20AllowanceMultisig(
						web3,
						payOptionSelected.paymentToken,
						userAddress,
						priceToPay,
						registryContract
					)
				} else {
					await makeERC20Allowance(
						web3,
						payOptionSelected.paymentToken,
						userAddress,
						priceToPay,
						registryContract
					)
				}
			} catch(e: any) {
				setModal({
					type: _ModalTypes.error,
					title: `Cannot approve ${paymentTokenSymbol}`,
					details: [
						`User address: ${userAddress}`,
						`Payment token: ${paymentTokenSymbol} ${payOptionSelected.paymentToken}`,
						`Subscription price with fee: ${priceToPay}`,
						`Balance: ${balance.balance.toString()}`,
						`Allowance for registry (${registryContract}): ${balance.allowance?.amount.toString()}`,
						`Agent: ${agentContract}`,
						`Service: ${serviceContract}`,
						'',
						`${e.message || e}`
					]
				});
				return;
			}
		}

		updateStepAdvancedLoader({
			id: 'approve',
			status: _AdvancedLoadingStatus.complete
		});
		updateStepAdvancedLoader({
			id: 'buy',
			status: _AdvancedLoadingStatus.loading
		});

		let txResp: any;
		try {
			if ( isMultisig ) {
				txResp = await buySubscriptionMultisig(
					web3,
					registryContract,
					serviceContract,
					agentContract,
					subscriptionTariffSelectedIdx,
					payOptionSelected,
					userAddress,
					receiver
				)
			} else {
				txResp = await buySubscription(
					web3,
					registryContract,
					serviceContract,
					agentContract,
					subscriptionTariffSelectedIdx,
					payOptionSelected,
					userAddress,
					receiver
				)
			}
		} catch(e: any) {
			setModal({
				type: _ModalTypes.error,
				title: `Cannot buy subscription`,
				details: [
					`User address: ${userAddress}`,
					`Buy for: ${receiver}`,
					`Payment token: ${paymentTokenSymbol} ${payOptionSelected.paymentToken}`,
					`Subscription price with fee: ${priceToPay}`,
					`Balance: ${balance.balance.toString()}`,
					`Allowance for registry (${registryContract}): ${balance.allowance?.amount.toString()}`,
					`Agent: ${agentContract}`,
					`Service: ${serviceContract}`,
					'',
					`${e.message || e}`
				]
			});
			return;
		}

		if ( isMultisig ) {
			setTimeout(() => {
				setModal({
					type: _ModalTypes.success,
					text: [{ text: 'Transactions have been created' }],
					links: currentChain ? [{
						text: `View on ${currentChain.explorerName}`,
						url: combineURLs(currentChain.explorerBaseUrl, `/tx/${txResp?.transactionHash || ''}`)
					}] : []
				});
				closePopup();
				updateTicket();
			}, 1000)
		} else {
			setTimeout(() => {
				setModal({
					type: _ModalTypes.success,
					text: [{ text: 'Subscription successfully bought' }],
					links: currentChain ? [{
						text: `View on ${currentChain.explorerName}`,
						url: combineURLs(currentChain.explorerBaseUrl, `/tx/${txResp?.transactionHash || ''}`)
					}] : []
				});
				closePopup();
				updateTicket();
			}, 1000)
		}
	}

	return (
		<div className="modal">
		<div
				className="modal__inner"
				onMouseDown={(e) => {
					e.stopPropagation();
					if ((e.target as HTMLTextAreaElement).className === 'modal__inner' || (e.target as HTMLTextAreaElement).className === 'container') {
						closePopup();
					}
				}}
			>
		<div className="modal__bg"></div>
		<div className="container">
		<div className="modal__content">
			<div
				className="modal__close"
				onClick={() => {
					closePopup();
				}}
			>
				<svg width="37" height="37" viewBox="0 0 37 37" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path fillRule="evenodd" clipRule="evenodd" d="M35.9062 36.3802L0.69954 1.17351L1.25342 0.619629L36.4601 35.8263L35.9062 36.3802Z" fill="white"></path>
					<path fillRule="evenodd" clipRule="evenodd" d="M0.699257 36.3802L35.9059 1.17351L35.3521 0.619629L0.145379 35.8263L0.699257 36.3802Z" fill="white"></path>
				</svg>
			</div>
			<div className="c-add">
				<div className="c-add__text">
					<div className="h2">SAFT Subscription</div>
				</div>

				<div className="c-add__form">

					<div className="row mb-3">
						<div className="col-12"><span className="input-label">Subscription receiver</span></div>
						<div className="col-12">
							<div className="row mb-2">
								<div className="col-auto my-1">
									<label className="checkbox">
										<input
											type="checkbox"
											name="receiver"
											checked={ isMeCheckboxChecked() }
											disabled={ subscriptionRemainings !== undefined }
											onChange={() => { setRecieverEdited(false) }}
										/>
											<span className="check"> </span>
											<span className="check-text">Me</span>
									</label>
								</div>
								<div className="col-auto my-1">
									<label className="checkbox">
										<input
											type="checkbox"
											name="receiver"
											checked={ !isMeCheckboxChecked() }
											onChange={() => { setRecieverEdited(true) }}
										/>
											<span className="check"> </span>
											<span className="check-text">Another person</span>
									</label>
								</div>
							</div>
						</div>
						{
							!isMeCheckboxChecked() ? (
								<div className="col-12">
									<textarea
										className="input-control"
										placeholder="Paste token address"
										rows={1}
										value={ buyFor }
										onChange={(e) => { setBuyFor( e.target.value.toLowerCase().replace(/[^a-f0-9x]/g, "") ) }}
									></textarea>
								</div>
							) : null
						}
					</div>

					<div className="row">

						<div className="col-sm-7 mb-5 mb-sm-0">
							{ getPaymentTypeSelect() }
							{ getSubscriptionTypeSelect() }
							{ getSubscriptionPlanSelect() }
							{ getSubscriptionTokenSelect() }
						</div>

						<div className="col-sm-5">
							<div className="c-wrap mb-0">
								{ getTicketDetails() }
								<button
									className="btn btn-grad w-100"
									disabled={ isSubmitDisabled() }
									onClick={ buySubmit }
								>Subscribe</button>
							</div>
						</div>
					</div>
				</div>

			</div>
		</div>
		</div>
		</div>
		</div>
	)
}