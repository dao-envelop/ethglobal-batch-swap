
import React, {
	ReactNode,
	useContext,
	useEffect,
	useState
} from "react";
import { Web3Context } from "../Web3Dispatcher";
import default_icon from '../../static/pics/coins/_default.svg';

import config from '../../app.config.json';
import {
	_AssetType,
	Allowance,
	ERC20Balance,
	ERC20Type
} from "../../utils/_types";
import {
	_getCacheItem,
	_setCacheItem,
	chainTypeToERC20,
	combineURLs,
	createContract,
	getNullERC20,
	BigNumber
} from "../../utils/utils";
import {
	CHAINS_DATA,
	getDefaultWeb3,
	getNativeBalance
} from "../Web3Dispatcher/web3dispatcher";

export const getERC20BalanceFromChain = async (chainId: number, contractAddress: string, userAddress: string, allowanceTo?: string): Promise<ERC20Balance> => {

	const web3 = await getDefaultWeb3(chainId);
	if ( !web3 ) {
		throw new Error('Cannot connect to blockchain');
	}

	const contract = await createContract(web3, '_erc20', contractAddress);

	let balance   = new BigNumber(0);
	let allowance = undefined;

	balance = new BigNumber(await contract.methods.balanceOf(userAddress).call());
	if ( allowanceTo ) {
		allowance = {
			allowanceTo,
			amount: new BigNumber(await contract.methods.allowance(userAddress, allowanceTo).call())
		}
	}

	return {
		contractAddress,
		balance,
		allowance,
	}
}
export const getERC20ParamsFromAPI = async (chainId: number, contractAddress: string, userAddress?: string): Promise<ERC20Type | undefined> => {

	const BASE_URL = process.env.REACT_APP_PROXY_API_BASE_URL;
	if ( !BASE_URL ) {
		console.log('No proxy base url in .env');
		throw new Error('No proxy base url in .env');
	}

	const url = combineURLs(BASE_URL, `/token/${chainId}/${contractAddress}`);

	let respParsed;
	try {
		const resp = await fetch(url);

		if ( !resp || !resp.ok ) {
			return undefined
		}
		if ( resp && resp.ok ) {
			respParsed = await resp.json();
		}
	} catch (e) {
		console.log('Cannot fetch token from oracle', e);
		throw new Error('Cannot fetch token from oracle');
	}

	if ( !respParsed ) {
		console.log('Cannot fetch token from oracle');
		throw new Error('Cannot fetch token from oracle');
	}

	let balance = new BigNumber(0);
	if ( userAddress ) {
		balance = (await getERC20BalanceFromChain(chainId, contractAddress, userAddress)).balance;
	}
	let allowance: Array<Allowance> = [];

	let icon = respParsed.logoURI;

	return {
		contractAddress,
		assetType: _AssetType.ERC20,
		name: respParsed.name,
		symbol: respParsed.symbol,
		decimals: parseInt(respParsed.decimals),
		icon,
		balance,
		allowance,
	};
}

export const getERC20ParamsFromChain = async (chainId: number, contractAddress: string, userAddress?: string, allowanceTo?: string): Promise<ERC20Type> => {
	const web3 = await getDefaultWeb3(chainId);
	if ( !web3 ) {
		throw new Error('Cannot connect to blockchain');
	}
	const contract = await createContract(web3, '_erc20', contractAddress);

	let name        = '';
	let symbol      = '';
	let decimals    = 18;
	let balance     = new BigNumber(0);
	let icon        = default_icon;

	let allowance: Array<Allowance> = [];

	decimals   = parseInt(await contract.methods.decimals().call());
	name       = await contract.methods.name().call();
	symbol     = await contract.methods.symbol().call();

	if ( userAddress ) {
		balance = new BigNumber(await contract.methods.balanceOf(userAddress).call());
		if ( allowanceTo ) {
			allowance = [{
				allowanceTo: allowanceTo,
				amount: new BigNumber(await contract.methods.allowance(userAddress, allowanceTo).call()),
			}]
		}
	}

	try { icon = require(`../../static/pics/coins/${symbol.toLowerCase()}.jpeg`         ) } catch (ignored) {}
	try { icon = require(`../../static/pics/coins/${symbol.toLowerCase()}.jpg`          ) } catch (ignored) {}
	try { icon = require(`../../static/pics/coins/${symbol.toLowerCase()}.png`          ) } catch (ignored) {}
	try { icon = require(`../../static/pics/coins/${symbol.toLowerCase()}.svg`          ) } catch (ignored) {}
	try { icon = require(`../../static/pics/coins/${contractAddress.toLowerCase()}.jpeg`) } catch (ignored) {}
	try { icon = require(`../../static/pics/coins/${contractAddress.toLowerCase()}.jpg` ) } catch (ignored) {}
	try { icon = require(`../../static/pics/coins/${contractAddress.toLowerCase()}.png` ) } catch (ignored) {}
	try { icon = require(`../../static/pics/coins/${contractAddress.toLowerCase()}.svg` ) } catch (ignored) {}

	return {
		contractAddress: contractAddress,
		assetType: _AssetType.ERC20,
		name,
		symbol,
		decimals,
		icon,
		balance,
		allowance,
	}
}
export const getERC20Params = async (chainId: number, contractAddress: string, userAddress?: string, allowanceTo?: string): Promise<ERC20Type> => {

	// native token fallback
	if ( contractAddress === '0x0000000000000000000000000000000000000000' ) {
		const chainData = CHAINS_DATA.find((item) => { return chainId === item.chainId });
		if ( !chainData ) {
			return getNullERC20(contractAddress);
		}

		let nativeBalance = new BigNumber(0);
		if ( userAddress ) {
			nativeBalance = await getNativeBalance(chainId, userAddress);
		}

		return {
			contractAddress,
			assetType: _AssetType.native,
			icon: default_icon,
			decimals: chainData.decimals,
			name: chainData.name,
			symbol: chainData.symbol,
			balance: nativeBalance,
			allowance: [],
		}
	}

	let erc20Cached: Array<ERC20Type> = _getCacheItem('erc20List') || [];
	const erc20CachedFound: ERC20Type | undefined = erc20Cached.find((item: ERC20Type) => { return contractAddress.toLowerCase() === item.contractAddress.toLowerCase() });
	if ( erc20CachedFound ) {
		if ( !userAddress ) {
			return erc20CachedFound;
		}

		const balanceFetched = await getERC20BalanceFromChain(chainId, contractAddress, userAddress, allowanceTo);
		const balance = balanceFetched.balance;
		let allowance: Array<Allowance> = [];
		if ( balanceFetched.allowance ) {
			allowance = [
				...erc20CachedFound.allowance.filter((item: Allowance) => { return item.allowanceTo.toLowerCase() !== balanceFetched.allowance?.allowanceTo.toLowerCase() }),
				balanceFetched.allowance,
			]
		}

		let token = {
			...erc20CachedFound,
			balance,
			allowance,
		}
		erc20Cached = _getCacheItem('erc20List') || [];
		_setCacheItem('erc20List', [
			...erc20Cached.filter((item: ERC20Type) => { return item.contractAddress.toLowerCase() !== token?.contractAddress.toLowerCase() }),
			token
		]);

		return token;
	}

	let erc20Requested = _getCacheItem('erc20Requested') || [];
	const erc20RequestedFound = erc20Requested.find((item: string) => { return contractAddress.toLowerCase() === item.toLowerCase() });
	if ( erc20RequestedFound ) { return getNullERC20(contractAddress); }

	_setCacheItem('erc20Requested', [
		...erc20Requested,
		contractAddress
	]);

	let token: ERC20Type | undefined = erc20CachedFound;
	try {
		token = await getERC20ParamsFromAPI(chainId, contractAddress, userAddress);
	} catch(e) {
		throw e;
	}

	if ( !token ) {
		token = await getERC20ParamsFromChain(chainId, contractAddress, userAddress, allowanceTo)
	}

	if ( !token ) {
		return getNullERC20(contractAddress);
	}

	erc20Requested = _getCacheItem('erc20Requested') || [];
	_setCacheItem('erc20Requested', erc20Requested.filter((item: string) => { return item.toLowerCase() !== contractAddress.toLowerCase() }));

	erc20Cached = _getCacheItem('erc20List') || [];
	_setCacheItem('erc20List', [
		...erc20Cached.filter((item: ERC20Type) => { return item.contractAddress.toLowerCase() !== token?.contractAddress.toLowerCase() }),
		token
	]);

	return token;

}

export type ERC20ContextType = {
	erc20List         : Array<ERC20Type>,
	ERC20Balances     : Array<{ walletAddress: string, balance: ERC20Balance}>,
	requestERC20Token : (contractAddress: string, userAddress?: string, allowanceTo?: string) => Promise<ERC20Type | undefined>,
	updateAllBalances : (userAddress: string, allowanceTo?: string) => void,
	updateERC20Balance: (contractAddress: string, userAddress: string, allowanceTo?: string) => Promise<{ walletAddress: string, balance: ERC20Balance } | undefined>,
	getERC20Balance   : (contractAddress: string, userAddress: string, allowanceTo?: string) => Promise<{ walletAddress: string, balance: ERC20Balance } | undefined>,
}

export const ERC20Context = React.createContext<ERC20ContextType>({
	erc20List         : [],
	ERC20Balances     : [],
	requestERC20Token : async () => undefined,
	updateAllBalances : async () => undefined,
	updateERC20Balance: async () => undefined,
	getERC20Balance   : async () => undefined,
});

export function ERC20Dispatcher(props: { children: ReactNode }) {

	const [ erc20List    , setErc20List     ] = useState<Array<ERC20Type>>([]);
	const [ ERC20Balances, setERC20Balances ] = useState<Array<{ walletAddress: string, balance: ERC20Balance }>>([]);

	const {
		currentChain,
		userAddress,
	} = useContext(Web3Context);

	useEffect(() => {
		if ( !currentChain ) { return; }

		const foundChain: any = config.CHAIN_SPECIFIC_DATA.find((item) => { return item.chainId === currentChain.chainId });
		if ( !foundChain || !foundChain.supportedERC20Tokens ) {
			setErc20List([]);
			return;
		}

		Promise.all(foundChain.supportedERC20Tokens.map(async (item: string) => {
			return await getERC20Params(currentChain.chainId, item, userAddress);
		})).then((data) => {
			setErc20List(data);
		});

	}, [ currentChain, userAddress ])

	const requestERC20Token = async (contractAddress: string, userAddress?: string, allowanceTo?: string) => {
		if ( !currentChain ) { return; }

		if ( contractAddress === '0x0000000000000000000000000000000000000000' ) {
			return chainTypeToERC20(currentChain)
		}

		if ( !userAddress ) {
			const foundToken = erc20List.find((item) => { return contractAddress.toLowerCase() === item.contractAddress.toLowerCase() })
			if ( foundToken ) { return foundToken }
		}

		const data = await getERC20Params(
			currentChain.chainId,
			contractAddress,
			userAddress,
			allowanceTo
		);

		setErc20List((prevState) => {
			return [
				...prevState.filter((item) => { return contractAddress.toLowerCase() !== item.contractAddress.toLowerCase() }),
				data
			]
		})
	}

	const updateAllBalances = async (userAddress: string, allowanceTo?: string) => {
		if ( !currentChain ) { return; }
		[
			chainTypeToERC20(currentChain),
			...erc20List
		].forEach((item) => { updateERC20Balance(item.contractAddress, userAddress, allowanceTo) })
	}
	const updateERC20Balance = async (contractAddress: string, userAddress: string, allowanceTo?: string): Promise<{ walletAddress: string, balance: ERC20Balance } | undefined> => {
		if ( !currentChain ) { return; }

		const foundERC20 = erc20List.find((item) => { return item.contractAddress.toLowerCase() === contractAddress.toLowerCase() });
		if ( !foundERC20 ) { requestERC20Token(contractAddress, userAddress, allowanceTo) }

		if ( contractAddress === '0x0000000000000000000000000000000000000000' ) {
			const balanceNative = await getNativeBalance(currentChain.chainId, userAddress);
			const fetchedBalance = {
				walletAddress: userAddress,
				balance: {
					contractAddress: '0x0000000000000000000000000000000000000000',
					balance: balanceNative
				}
			};

			setERC20Balances((prevState) => {
				return [
					...prevState.filter((item) => {
						return item.walletAddress.toLowerCase() !== userAddress.toLowerCase() ||
							item.balance.contractAddress.toLowerCase() !== contractAddress.toLowerCase()
					}),
					fetchedBalance
				]
			});

			return fetchedBalance;
		} else {
			const ERC20Balance: ERC20Balance = await getERC20BalanceFromChain(currentChain.chainId, contractAddress, userAddress, allowanceTo);
			const fetchedBalance: { walletAddress: string, balance: ERC20Balance } = {
				walletAddress: userAddress,
				balance: ERC20Balance
			};
			setERC20Balances((prevState) => {
				return [
					...prevState.filter((item) => {
						return item.walletAddress.toLowerCase() !== userAddress.toLowerCase() ||
							item.balance.contractAddress.toLowerCase() !== contractAddress.toLowerCase()
					}),
					fetchedBalance
				]
			});

			return fetchedBalance;
		}

	}
	const getERC20Balance = async (contractAddress: string, userAddress: string, allowanceTo?: string): Promise<{ walletAddress: string, balance: ERC20Balance } | undefined> => {
		if ( !currentChain ) { return; }

		const foundERC20 = erc20List.find((item) => { return item.contractAddress.toLowerCase() === contractAddress.toLowerCase() });
		if ( !foundERC20 ) {
			requestERC20Token(contractAddress, userAddress, allowanceTo);
			return await updateERC20Balance(contractAddress, userAddress, allowanceTo);
		}

		const foundBalance = ERC20Balances.find((item) => {
			return item.walletAddress.toLowerCase() === userAddress.toLowerCase() &&
			item.balance.contractAddress.toLowerCase() === contractAddress.toLowerCase()
		});

		if ( foundBalance ) { return foundBalance; }

		return await updateERC20Balance(contractAddress, userAddress, allowanceTo);

	}

	return (
		<ERC20Context.Provider value={{
			erc20List,
			ERC20Balances,
			requestERC20Token,
			updateAllBalances,
			updateERC20Balance,
			getERC20Balance,
		}}>
			{ props.children }
		</ERC20Context.Provider>
	);
  };