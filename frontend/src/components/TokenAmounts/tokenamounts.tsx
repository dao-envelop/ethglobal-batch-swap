
import {
	useContext,
	useState
} from 'react';

import default_token_preview from '../../static/pics/tb-nft-default.svg';
import icon_loading          from '../../static/pics/loading.svg';
import icon_send             from "../../static/pics/icons/i-send.svg";
import default_icon          from '../../static/pics/coins/_default.svg';
import {
	_ModalTypes,
	ERC20Context,
	InfoModalContext,
	Web3Context
} from '../../dispatchers';
import TippyWrapper from '../TippyWrapper';
import {
	executeTxBatch,
	prepareTxTransferERC20Token,
	prepareTxTransferNativeToken,
} from '../../utils/smartwallets';
import {
	_Asset,
	_AssetType
} from '../../utils/_types';
import {
	chainTypeToERC20,
	combineURLs,
	compactString,
	getNullERC20,
	tokenToFloat
} from '../../utils/utils';

export interface CollateralItem extends _Asset {
	tokenId?: string,
	amount?: BigNumber,
	tokenImg?: string,
}

type TokenAmountsProps = {
	walletAddress       : string,
	tokens              : Array<CollateralItem>,
	recipients          : number,
	rows                : number,
	nonRemovableAddress?: string,
	SMALL_AMOUNT?       : number,
}

export default function TokenAmounts(props: TokenAmountsProps) {

	const {
		web3,
		currentChain,
		userAddress,
	} = useContext(Web3Context);
	const {
		erc20List,
		requestERC20Token,
		ERC20Balances,
		updateAllBalances,
	} = useContext(ERC20Context);
	const {
		setModal,
		unsetModal,
		setLoading,
	} = useContext(InfoModalContext);

	const {
		walletAddress,
		tokens,
		rows,
		nonRemovableAddress,
		recipients
	} = props;

	const [ walletBalancesBlockOpened, setWalletBalancesBlockOpened ] = useState(true);

	const transferNativeTokenSubmit = async (item: CollateralItem) => {

		if ( !web3 ) { return; }
		if ( !currentChain ) { return; }
		if ( !userAddress ) { return; }
		if ( !item.amount ) { return; }
		if ( walletAddress === '' ) { return; }

		setLoading('Waiting to transfer');

		let txResp;
		let tx;
		try {
			tx = await prepareTxTransferNativeToken(currentChain.chainId, userAddress, item.amount);
		} catch (e: any) {
			setModal({
				type: _ModalTypes.error,
				title: `Cannot transfer token`,
				details: [
					`Stage: prepare_tx`,
					`Token: ${item.contractAddress}`,
					`User address: ${userAddress}`,
					`Wallet address: ${walletAddress}`,
					`Smart wallet balances: ${JSON.stringify(ERC20Balances.filter((item) => { return item.walletAddress.toLowerCase() === walletAddress.toLowerCase() }))}`,
					'',
					e.message || e,
				]
			});
			return;
		}

		if ( !tx ) { return; }

		try {
			txResp = await executeTxBatch(web3, walletAddress, userAddress, [ tx ]);
		} catch(e: any) {
			setModal({
				type: _ModalTypes.error,
				title: `Cannot create wallet`,
				details: [
					`Stage: execute_tx`,
					`Token: ${item.contractAddress}`,
					`User address: ${userAddress}`,
					`Wallet address: ${walletAddress}`,
					`Smart wallet balances: ${JSON.stringify(ERC20Balances.filter((item) => { return item.walletAddress.toLowerCase() === walletAddress.toLowerCase() }))}`,
					'',
					e.message || e,
				]
			});
			return;
		}

		updateAllBalances(walletAddress);
		unsetModal();
		setModal({
			type: _ModalTypes.success,
			title: `Token has been transferred`,
			buttons: [{
				text: 'Ok',
				clickFunc: () => {
					unsetModal();
				}
			}],
			links: [{
				text: `View tx on ${currentChain.explorerName}`,
				url: combineURLs(currentChain.explorerBaseUrl, `/tx/${txResp.transactionHash}`)
			}],
		});
	}
	const getAmount  = (item: CollateralItem) => {
		if ( !item.amount ) { return null; }
		if ( !currentChain ) { return null; }

		let foundToken = [
			chainTypeToERC20(currentChain),
			...erc20List
		].find((iitem) => {
			return item.contractAddress.toLowerCase() === iitem.contractAddress.toLowerCase();
		});
		if ( !foundToken ) {
			foundToken = getNullERC20(item.contractAddress);
		}

		if ( !props.SMALL_AMOUNT ) {
			return (<td>{tokenToFloat(item.amount.multipliedBy(recipients), foundToken.decimals || 18).toFixed(5) }</td>)
		}
		if ( tokenToFloat(item.amount, foundToken.decimals).lt(props.SMALL_AMOUNT) ) {
			return (
				<TippyWrapper msg={ tokenToFloat(item.amount, foundToken.decimals).toString() }>
					<td>&lt;&nbsp;0.00001</td>
				</TippyWrapper>
			)
		}
		return (<td>{tokenToFloat(item.amount.multipliedBy(recipients), foundToken.decimals || 18).toFixed(5) }</td>)
	}
	const getCollateralNativeRow = (item: CollateralItem) => {

		if ( !currentChain ) { return null; }
		if ( !item.amount ) { return null; }

		return (
			<tr key={ `${item.contractAddress}` }>
				<td>
					<div className="tb-coin">
						<span className="i-coin">
							<img src={ currentChain.tokenIcon || default_icon } alt="" />
						</span>
						<span>
							{ currentChain.symbol }
							{ ' ' }
						</span>
					</div>
				</td>
				{ getAmount(item) }
				<td>
					<TippyWrapper msg="Transfer to personal wallet">
						<button
							className="btn btn-md btn-gray btn-img ml-5"
							onClick={() => {
								transferNativeTokenSubmit(item);
							}}
						>
							<img src={ icon_send } alt="" />
						</button>
					</TippyWrapper>
				</td>
			</tr>
		)
	}
	const transferERC20TokenSubmit = async (item: CollateralItem) => {

		if ( !web3 ) { return; }
		if ( !currentChain ) { return; }
		if ( !userAddress ) { return; }
		if ( !item.amount ) { return; }
		if ( walletAddress === '' ) { return; }

		setLoading('Waiting to transfer');

		let txResp;
		let tx;
		try {
			tx = await prepareTxTransferERC20Token(currentChain.chainId, item.contractAddress, userAddress, item.amount);
		} catch (e: any) {
			setModal({
				type: _ModalTypes.error,
				title: `Cannot transfer token`,
				details: [
					`Stage: prepare_tx`,
					`Token: ${item.contractAddress}`,
					`User address: ${userAddress}`,
					`Wallet address: ${walletAddress}`,
					`Smart wallet balances: ${JSON.stringify(ERC20Balances.filter((item) => { return item.walletAddress.toLowerCase() === walletAddress.toLowerCase() }))}`,
					'',
					e.message || e,
				]
			});
			return;
		}

		if ( !tx ) { return; }

		try {
			txResp = await executeTxBatch(web3, walletAddress, userAddress, [ tx ]);
		} catch(e: any) {
			setModal({
				type: _ModalTypes.error,
				title: `Cannot create wallet`,
				details: [
					`Stage: execute_tx`,
					`Token: ${item.contractAddress}`,
					`User address: ${userAddress}`,
					`Wallet address: ${walletAddress}`,
					`Smart wallet balances: ${JSON.stringify(ERC20Balances.filter((item) => { return item.walletAddress.toLowerCase() === walletAddress.toLowerCase() }))}`,
					'',
					e.message || e,
				]
			});
			return;
		}

		updateAllBalances(walletAddress);
		unsetModal();
		setModal({
			type: _ModalTypes.success,
			title: `Token has been transferred`,
			buttons: [{
				text: 'Ok',
				clickFunc: () => {
					unsetModal();
				}
			}],
			links: [{
				text: `View tx on ${currentChain.explorerName}`,
				url: combineURLs(currentChain.explorerBaseUrl, `/tx/${txResp.transactionHash}`)
			}],
		});
	}
	const getCollateralERC20Row = (item: CollateralItem) => {

		if ( !currentChain ) { return null; }
		if ( !item.amount ) { return null; }

		let foundToken = erc20List.find((iitem) => {
			if ( !iitem.contractAddress ) { return false; }
			return item.contractAddress.toLowerCase() === iitem.contractAddress.toLowerCase()
		});
		if ( !foundToken ) {
			requestERC20Token(item.contractAddress);
			foundToken = getNullERC20(item.contractAddress);
		}

		return (
			<tr key={ `${item.contractAddress}` }>
				<td>
					<div className="tb-coin">
						<span className="i-coin">
							<img src={ foundToken.icon || default_icon } alt="" />
						</span>
						<span>
							{ foundToken.symbol }
							{ ' ' }
						</span>
					</div>
				</td>
				{ getAmount(item) }
				<td>
					<TippyWrapper msg="Transfer to personal wallet">
						<button
							className="btn btn-md btn-gray btn-img ml-5"
							onClick={() => {
								transferERC20TokenSubmit(item);
							}}
						>
							<img src={ icon_send } alt="" />
						</button>
					</TippyWrapper>
				</td>
			</tr>
		)
	}
	const getNFTPreview = (item: CollateralItem) => {
		if ( item.tokenImg === undefined ) {
			return (
				<img src={ icon_loading } alt="" />
			)
		}
		if ( item.tokenImg === '' ) {
			return ( <img src={ default_token_preview } alt="" /> )
		}

		return (
			<img src={ item.tokenImg } alt="" />
		)
	}
	const getCollateralERC721Row = (item: CollateralItem) => {
		if ( !currentChain ) { return null; }

		return (
			<tr key={ `${item.contractAddress}${item.tokenId}` }>
				<td>
					<div className="tb-nft">
						<span className="i-coin">
							{ getNFTPreview(item) }
						</span>
						<span>
							({ currentChain.EIPPrefix }-721) { compactString(item.contractAddress) }
						</span>
					</div>
				</td>
				<td>1</td>
			</tr>
		)
	}
	const get1155Amount = (qty: BigNumber | undefined) => {
		if ( !qty ) { return '' }
		if ( qty.eq(0) ) { return '' }
		if ( qty.eq(1) ) { return '1 item' }
		return `${qty} items`
	}
	const getCollateralERC1155Row = (item: CollateralItem) => {
		if ( !currentChain ) { return null; }
		if ( !item.amount ) { return null; }

		return (
			<tr key={ `${item.contractAddress}${item.tokenId}` }>
				<td>
					<div className="tb-nft">
						<span className="i-coin">
							{ getNFTPreview(item) }
						</span>
						<span>
							({ currentChain.EIPPrefix }-1155) { compactString(item.contractAddress) }
						</span>
					</div>
				</td>
				<td>{ get1155Amount(item.amount.multipliedBy(recipients)) }</td>
			</tr>
		)
	}

	const transferERC20TokenAllSubmit = async () => {

		if ( !web3 ) { return; }
		if ( !currentChain ) { return; }
		if ( !userAddress ) { return; }
		if ( walletAddress === '' ) { return; }

		setLoading('Waiting to transfer');

		let txResp;
		let txs: any = [];
		try {
			ERC20Balances
			.filter((item) => { return item.walletAddress.toLowerCase() === walletAddress.toLowerCase() })
			.filter((item) => { return !item.balance.balance.eq(0) })
			.filter((item) => {
				const foundERC20 = erc20List.find((iitem) => { return item.balance.contractAddress.toLowerCase() === iitem.contractAddress.toLowerCase() });
				if ( foundERC20 && foundERC20.decimals === 0 ) { return false; }
				return true;
			})
			.forEach(async (item) => {
				if ( item.balance.contractAddress === '0x0000000000000000000000000000000000000000' ) {
					txs.push(await prepareTxTransferNativeToken(currentChain.chainId, userAddress, item.balance.balance))
				} else {
					txs.push(await prepareTxTransferERC20Token(currentChain.chainId, item.balance.contractAddress, userAddress, item.balance.balance))
				}
			})
		} catch (e: any) {
			setModal({
				type: _ModalTypes.error,
				title: `Cannot transfer token`,
				details: [
					`Stage: prepare_tx`,
					`User address: ${userAddress}`,
					`Wallet address: ${walletAddress}`,
					`Smart wallet balances: ${JSON.stringify(ERC20Balances.filter((item) => { return item.walletAddress.toLowerCase() === walletAddress.toLowerCase() }))}`,
					'',
					e.message || e,
				]
			});
			return;
		}

		console.log('txs', txs);

		try {
			txResp = await executeTxBatch(web3, walletAddress, userAddress, txs);
		} catch(e: any) {
			setModal({
				type: _ModalTypes.error,
				title: `Cannot create wallet`,
				details: [
					`Stage: execute_tx`,
					`User address: ${userAddress}`,
					`Wallet address: ${walletAddress}`,
					`Smart wallet balances: ${JSON.stringify(ERC20Balances.filter((item) => { return item.walletAddress.toLowerCase() === walletAddress.toLowerCase() }))}`,
					'',
					e.message || e,
				]
			});
			return;
		}

		updateAllBalances(walletAddress);
		unsetModal();
		setModal({
			type: _ModalTypes.success,
			title: `Token has been transferred`,
			buttons: [{
				text: 'Ok',
				clickFunc: () => {
					unsetModal();
				}
			}],
			links: [{
				text: `View tx on ${currentChain.explorerName}`,
				url: combineURLs(currentChain.explorerBaseUrl, `/tx/${txResp.transactionHash}`)
			}],
		});
	}

	if ( !tokens.length ) { return null; }

	return (
		<>
		<div
			className={`c-wrap__toggle ${walletBalancesBlockOpened ? 'active' : ''}`}
			onClick={() => { setWalletBalancesBlockOpened(!walletBalancesBlockOpened); }}
		>
			<div><b>Wallet balances</b></div>
		</div>

		{
			walletBalancesBlockOpened ? (
				<>
				<div className="c-wrap__dropdown">
					<div className={ `c-wrap__summary` } style={{ marginTop: '0' }}>
					<div className="row">
					{
						tokens
						.sort((item, prev) => {
							if (
								nonRemovableAddress &&
								item.contractAddress.toLowerCase() === nonRemovableAddress.toLowerCase()
							) { return -1; }
							if (
								nonRemovableAddress &&
								prev.contractAddress.toLowerCase() === nonRemovableAddress.toLowerCase()
							) { return 1; }

							if ( item.assetType < prev.assetType ) { return -1 }
							if ( item.assetType > prev.assetType ) { return  1 }

							if ( item.contractAddress.toLowerCase() < prev.contractAddress.toLowerCase() ) { return -1 }
							if ( item.contractAddress.toLowerCase() > prev.contractAddress.toLowerCase() ) { return  1 }

							if ( item.tokenId && prev.tokenId ) {
								try {
									if ( new BigNumber(item.tokenId).isNaN() || new BigNumber(prev.tokenId).isNaN() ) {
										if ( parseInt(`${item.tokenId}`) < parseInt(`${prev.tokenId}`) ) { return -1 }
										if ( parseInt(`${item.tokenId}`) > parseInt(`${prev.tokenId}`) ) { return  1 }
									}
									const itemTokenIdNumber = new BigNumber(item.tokenId);
									const prevTokenIdNumber = new BigNumber(prev.tokenId);

									if ( itemTokenIdNumber.lt(prevTokenIdNumber) ) { return -1 }
									if ( itemTokenIdNumber.gt(prevTokenIdNumber) ) { return  1 }
								} catch ( ignored ) {
									if ( `${item.tokenId}`.toLowerCase() < `${prev.tokenId}`.toLowerCase() ) { return -1 }
									if ( `${item.tokenId}`.toLowerCase() > `${prev.tokenId}`.toLowerCase() ) { return  1 }
								}
							}

							return 0
						})
						.reduce((acc: Array<Array<CollateralItem>>, _, i, array) => {
							if (i % rows === 0) { acc.push( array.slice(i, i + rows) ) }
							return acc
						}, [])
						.map((item, idx) => {
							return (
								<div className="col-12 col-sm-6 col-md-4 col-lg-3 ml-3" key={ idx }>
									<table>
										<tbody>
											{
												item.map((iitem) => {
													if ( iitem.assetType === _AssetType.native  ) { return getCollateralNativeRow(iitem)  }
													if ( iitem.assetType === _AssetType.ERC20   ) { return getCollateralERC20Row(iitem)   }
													if ( iitem.assetType === _AssetType.ERC721  ) { return getCollateralERC721Row(iitem)  }
													if ( iitem.assetType === _AssetType.ERC1155 ) { return getCollateralERC1155Row(iitem) }

													return null;
												})
											}
										</tbody>
									</table>

								</div>
							)
						})
					}
					</div>
					<div className="row">
						<button
							className="btn btn-md btn-gray btn-img ml-5 mt-3"
							onClick={() => {
								transferERC20TokenAllSubmit();
							}}
						>
							Transfer all <img className="ml-2" src={ icon_send } alt="" />
						</button>
					</div>
				</div>
				</div>

				</>
			) : null
		}
		</>
	)
}