
import React, {
	ReactNode,
	useContext,
	useEffect,
	useState
} from "react";
import {
	matchRoutes,
	useLocation,
} from "react-router-dom";

import {
	BigNumber,
	ChainType,
	Web3,
	connect,
	disconnect as coredisconnect,
	connectSilent,
	getChainId,
	getChainParamsAllFromAPI,
	getUserAddress,
	localStorageGet,
	localStorageSet,
	requestChainChange,
	walletStateListener,
	getNativeBalance,
} from "@envelop/envelop-client-core";

import config from '../../app.config.json';
import {
	InfoModalContext,
	_ModalTypes
} from "../InfoModalDispatcher";

export type Web3ContextType = {
	web3: Web3 | null | undefined,
	getWeb3Force: Function,
	disconnect: Function,
	currentChain: ChainType | undefined,
	currentChainId: number,
	walletChainId: number,
	switchChain: Function,
	userAddress: string | undefined,
	availableChains: Array<ChainType>,
	balanceNative: BigNumber,
}

export const Web3Context = React.createContext<Web3ContextType>({
	web3: undefined,
	currentChain: undefined,
	currentChainId: 1,
	walletChainId: 1,
	switchChain: () => {},
	userAddress: undefined,
	availableChains: [],
	getWeb3Force: () => {},
	disconnect: () => {},
	balanceNative: new BigNumber(0),
});

type Web3DispatcherProps= {
	switchChainCallback?: (targetChainId: number) => void,
	children: ReactNode
}

export function Web3Dispatcher(props: Web3DispatcherProps) {

	const {
		switchChainCallback
	} = props;

	const sourceUrlParams = [
		{ path: "/:chainId/:contractAddress/:tokenId" },
		{ path: "/:chainId/:contractAddress" },
		{ path: "/:chainId" },
	];

	const {
		setModal,
		unsetModal,
	} = useContext(InfoModalContext);

	// undefined means initial connect in progress; null means no wallet
	const [ web3,            setWeb3            ] = useState<Web3 | null | undefined>(undefined);
	const [ currentChain,    setCurrentChain    ] = useState<ChainType | undefined>(undefined);
	const [ userAddress,     setUserAddress     ] = useState<string | undefined>(undefined);
	const [ availableChains, setAvailableChains ] = useState<Array<ChainType>>([]);

	const [ balanceNative,   _setBalanceNative  ] = useState<BigNumber>(new BigNumber(0));

	const [ currentChainId,  setCurrentChainId  ] = useState<number>(0);
	const [ walletChainId,    setWalletChainId    ] = useState<number>(0);

	const configTyped: any = config;
	const location         = useLocation();
	const matches          = matchRoutes(sourceUrlParams, location);

	// get available chains
	useEffect(() => {

		const fetchAvailableChains = async () => {
			const chainsData = await getChainParamsAllFromAPI();
			const chainsFromConfig = config.CHAIN_SPECIFIC_DATA;
			setAvailableChains(chainsData.filter((item) => {
				return !!chainsFromConfig.find((iitem) => {
					return item.chainId === iitem.chainId
				})
			}));
		}
		fetchAvailableChains();

	}, [ ])

	const walletEventsHandler = async () => {
		if ( !web3 ) { return; }
		const _userAddress = await getUserAddress(web3);
		if ( _userAddress ) {
			setUserAddress(_userAddress);
		} else {
			disconnect();
			return;
		}

		const _chainId = await getChainId(web3);
		if ( !_chainId ) { return; }

		let _availableChains = availableChains;
		if ( !_availableChains.length ) {
			const chainsData = await getChainParamsAllFromAPI();
			const chainsFromConfig = config.CHAIN_SPECIFIC_DATA;
			_availableChains = chainsData.filter((item) => {
				return !!chainsFromConfig.find((iitem) => {
					return item.chainId === iitem.chainId
				})
			})
		}

		const foundInAvailableChain = !!_availableChains.find((item) => { return item.chainId === _chainId });
		if ( !foundInAvailableChain ) {
			setModal({
				type: _ModalTypes.error,
				title: 'Unsupported chain',
				text: [
					{ text: 'You can select one network of following:', clazz: 'text-bold' },
					{ text: `Mainnets: ${_availableChains.filter((item) => { return !item.isTestNetwork }).map((item) => { return item.name }).join(', ')}`, clazz: 'text-green' },
					{ text: `Testnets: ${_availableChains.filter((item) => { return  item.isTestNetwork }).map((item) => { return item.name }).join(', ')}` },
				],
				buttons: [{
					text: 'Go to default',
					clickFunc: async () => {
						await requestChainChangeWrapper(configTyped.defaultChain);
						unsetModal();
					}
				}]
			});
			return;
		}

		if ( matches && matches[0] && matches[0].params && matches[0].params.chainId && parseInt(matches[0].params.chainId) ) {
			setWalletChainId(_chainId);
			setCurrentChainId(parseInt(matches[0].params.chainId));
		} else {
			setCurrentChainId(_chainId);
			setWalletChainId(_chainId);
		}

		if ( switchChainCallback ) { switchChainCallback(_chainId); }
		localStorageSet('lastChainId', `${_chainId}`);

	}
	// set metamask listener
	useEffect(() => {
		const setListener = () => {
			walletStateListener(() => {
				walletEventsHandler();
				setListener();
			})
		}

		setListener();
	}, [ web3 ]);

	useEffect(() => {
		const foundChain = availableChains.find((item) => { return item.chainId === currentChainId });
		if ( !foundChain ) { return; }
		setCurrentChain(foundChain);
	}, [ availableChains, currentChainId ])

	useEffect(() => {
		if ( !userAddress ) { _setBalanceNative(new BigNumber(0)); return; }
		if ( !currentChainId ) { _setBalanceNative(new BigNumber(0)); return; }

		getNativeBalance(currentChainId, userAddress).then((data) => { _setBalanceNative(data); })
	}, [ currentChainId, userAddress ])

	// get initial chain id
	useEffect(() => {

		const getInitialChainId = async () => {

			let savedChainToSet: number | undefined;

			const _web3 = await connectSilent();
			if ( _web3 ) {
				setWeb3(_web3);

				const _userAddress = await getUserAddress(_web3);
				if ( _userAddress !== undefined && _userAddress !== '' ) {
					setUserAddress(_userAddress);
				} else {
					disconnect();
				}

				const chainFromMetamask = await getChainId(_web3);
				savedChainToSet = chainFromMetamask;
			} else {
				setWeb3(null);
			}

			if ( !savedChainToSet ) {
				const savedChain = parseInt(localStorageGet('lastChainId'));
				if ( !isNaN(savedChain) ) {
					savedChainToSet = savedChain;
				}
			}

			if ( matches && matches[0] && matches[0].params && matches[0].params.chainId && parseInt(matches[0].params.chainId) ) {
				const _chainId = parseInt(matches[0].params.chainId);
				setCurrentChainId(_chainId);

				if ( !savedChainToSet ) {
					setWalletChainId(_chainId);
				} else {
					setWalletChainId(savedChainToSet);
					if ( _web3 && _chainId !== savedChainToSet ) {
						requestChainChangeWrapper(_chainId).catch((ignored) => {});
					}
				}
			} else {

				let _availableChains = availableChains;
				if ( !_availableChains.length ) {
					const chainsData = await getChainParamsAllFromAPI();
					const chainsFromConfig = config.CHAIN_SPECIFIC_DATA;
					_availableChains = chainsData.filter((item) => {
						return !!chainsFromConfig.find((iitem) => {
							return item.chainId === iitem.chainId
						})
					})
				}

				if ( savedChainToSet ) {

					const foundInAvailableChain = !!_availableChains.find((item) => { return item.chainId === savedChainToSet });
					if ( !foundInAvailableChain ) {
						setModal({
							type: _ModalTypes.error,
							title: 'Unsupported chain',
							text: [
								{ text: 'You can select one network of following:', clazz: 'text-bold' },
								{ text: `Mainnets: ${_availableChains.filter((item) => { return !item.isTestNetwork }).map((item) => { return item.name }).join(', ')}`, clazz: 'text-green' },
								{ text: `Testnets: ${_availableChains.filter((item) => { return  item.isTestNetwork }).map((item) => { return item.name }).join(', ')}` },
							],
							buttons: [{
								text: 'Go to default',
								clickFunc: async () => {
									if ( _web3 ) {
										try {
											await requestChainChangeWrapper(configTyped.defaultChain)
										} catch(e: any) {
											setModal({
												type: _ModalTypes.error,
												title: 'Cannot switch network',
												details: [
													`User address: ${userAddress}`,
													`Chain to set: ${savedChainToSet}`,
													`Available chains: ${_availableChains.map((item) => { return `${item.chainId} ${item.name}` }).join('; ')}`,
													``,
													e.message,
												],
												buttons: [{
													text: 'Ok',
													clickFunc: async () => {
														window.location.reload();
													}
												}]
											});
											return;
										}
									}
									setCurrentChainId(configTyped.defaultChain);
									setWalletChainId(configTyped.defaultChain);
									localStorageSet('lastChainId', `${configTyped.defaultChain}`);
									unsetModal();
								}
							}]
						});
						setCurrentChainId(configTyped.defaultChain);
						setWalletChainId(configTyped.defaultChain);
						localStorageSet('lastChainId', `${configTyped.defaultChain}`);
					} else {
						setCurrentChainId(savedChainToSet);
						setWalletChainId(savedChainToSet);
						localStorageSet('lastChainId', `${savedChainToSet}`);
					}

				} else {
					setCurrentChainId(configTyped.defaultChain);
					setWalletChainId(configTyped.defaultChain);
					localStorageSet('lastChainId', `${configTyped.defaultChain}`);
				}
			}

		}

		getInitialChainId();

	}, [ ] )

	const getWeb3Force = async (targetChainId?: number): Promise<{ web3: Web3, chain: ChainType, userAddress: string }> => {
		let _web3 = web3;

		if ( !_web3 ) {
			try {
				_web3 = await connect();
				if ( !_web3 ) { throw new Error('Cannot connect to wallet'); }
			} catch(e: any) { throw e; }
		}

		const _userAddress = await getUserAddress(_web3);
		if ( !_userAddress || _userAddress === '' ) { throw new Error('Cannot connect to wallet'); }

		let _chain = currentChain;

		const walletChainId = await getChainId(_web3);
		if ( targetChainId && walletChainId !== targetChainId ) {
			try {
				await requestChainChangeWrapper(targetChainId);
			} catch(e: any) { throw e; }

			_chain = availableChains.find((item) => { return item.chainId === targetChainId });
			if ( !_chain ) { throw new Error('Unsupported chain'); }

			setCurrentChainId(targetChainId);
			setWalletChainId(targetChainId);
			localStorageSet('lastChainId', `${targetChainId}`);
		} else {
			if ( walletChainId ) {
				_chain = availableChains.find((item) => { return item.chainId === walletChainId });
				if ( !_chain ) {
					setModal({
						type: _ModalTypes.error,
						title: 'Unsupported chain',
						text: [
							{ text: 'You can select one network of following:', clazz: 'text-bold' },
							{ text: `Mainnets: ${availableChains.filter((item) => { return !item.isTestNetwork }).map((item) => { return item.name }).join(', ')}`, clazz: 'text-green' },
							{ text: `Testnets: ${availableChains.filter((item) => { return  item.isTestNetwork }).map((item) => { return item.name }).join(', ')}` },
						],
						buttons: [{
							text: 'Go to default',
							clickFunc: async () => {
								try {
									await requestChainChangeWrapper(configTyped.defaultChain)
								} catch(e: any) {
									setModal({
										type: _ModalTypes.error,
										title: 'Cannot switch network',
										details: [
											`User address: ${userAddress}`,
											`Wallet chain: ${walletChainId}`,
											`Available chains: ${availableChains.map((item) => { return `${item.chainId} ${item.name}` }).join('; ')}`,
											``,
											e,
										],
										buttons: [{
											text: 'Ok',
											clickFunc: async () => {
												window.location.reload();
											}
										}]
									});
									return;
								}
								unsetModal();
							}
						}]
					});
					if ( targetChainId ) { throw new Error(); }
				}
				setCurrentChainId(walletChainId);
				setWalletChainId(walletChainId);
				localStorageSet('lastChainId', `${walletChainId}`);
			}
		}

		setWeb3(_web3);
		setUserAddress(_userAddress);

		if ( !_chain ) { throw new Error('No chain data'); }

		return {
			web3: _web3,
			chain: _chain,
			userAddress: _userAddress
		}

	}

	const switchChain = async (targetChainId: number) => {
		let _availableChains = availableChains;
		if ( !_availableChains.length ) {
			const chainsData = await getChainParamsAllFromAPI();
			const chainsFromConfig = config.CHAIN_SPECIFIC_DATA;
			_availableChains = chainsData.filter((item) => {
				return !!chainsFromConfig.find((iitem) => {
					return item.chainId === iitem.chainId
				})
			})
		}
		const foundInAvailableChain = !!_availableChains.find((item) => { return item.chainId === targetChainId })
		if ( !foundInAvailableChain ) {
			setModal({
				type: _ModalTypes.error,
				title: 'Unsupported chain',
				text: [
					{ text: 'You can select one network of following:', clazz: 'text-bold' },
					{ text: `Mainnets: ${_availableChains.filter((item) => { return !item.isTestNetwork }).map((item) => { return item.name }).join(', ')}`, clazz: 'text-green' },
					{ text: `Testnets: ${_availableChains.filter((item) => { return  item.isTestNetwork }).map((item) => { return item.name }).join(', ')}` },
				],
				buttons: [{
					text: 'Go to default',
					clickFunc: async () => {
						requestChainChangeWrapper(configTyped.defaultChain);
						unsetModal();
					}
				}]
			});
			return;
		}

		if ( web3 ) {
			await requestChainChangeWrapper(targetChainId);
		} else {
			if ( matches && matches[0] && matches[0].params && matches[0].params.chainId && parseInt(matches[0].params.chainId) ) {
				setWalletChainId(targetChainId);
			} else {
				setCurrentChainId(targetChainId);
				setWalletChainId(targetChainId);
			}

			if ( switchChainCallback ) { switchChainCallback(targetChainId); }
			localStorageSet('lastChainId', `${targetChainId}`);
		}
	}

	const requestChainChangeWrapper = async (targetChainId: number) => {
		try {
			await requestChainChange(targetChainId);
		} catch(e: any) {
			if ( e.code === 4902 || e.code === -32603 ) {
				try {
					await addChainToWallet(targetChainId);
				} catch(e: any) {
					throw e;
				}
			} else {
				throw e;
			}
		}
	}

	const addChainToWallet = async (targetChainId: number) => {
		if ( localStorageGet('authMethod').toLowerCase() !== 'metamask' ) { return; }

		const _availableChains = await getChainParamsAllFromAPI();
		const foundChain = _availableChains.find((item) => { return item.chainId === targetChainId });
		if ( !foundChain ) { console.log('No such chain', _availableChains, targetChainId); return; }

		await (window as any).ethereum.request({
			method: "wallet_addEthereumChain",
			params: [{
				chainId: '0x' + Number(foundChain.chainId).toString(16),
				rpcUrls: [ foundChain.RPCUrl ],
				chainName: foundChain.name,
				nativeCurrency: {
					name: foundChain.symbol,
					symbol: foundChain.symbol,
					decimals: foundChain.decimals
				},
				blockExplorerUrls: [ foundChain.explorerBaseUrl ]
			}]
		});
	}

	const disconnect = async () => {
		coredisconnect();
		setUserAddress(undefined);
		setWeb3(undefined);
		window.location.reload();
	}

	return (
		<Web3Context.Provider value={{
			web3,
			currentChain,
			currentChainId,
			walletChainId,
			switchChain,
			userAddress,
			availableChains,
			getWeb3Force,
			disconnect,
			balanceNative
		}}>
			{ props.children }
		</Web3Context.Provider>
	);
  };