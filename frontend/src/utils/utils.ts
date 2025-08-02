
import {
	_AssetType,
	ChainType,
	ERC20Type
} from './_types';

import default_icon from '../static/pics/coins/_default.svg';

import BigNumber from 'bignumber.js';
import Web3, { Contract } from 'web3';
BigNumber.config({ DECIMAL_PLACES: 50, EXPONENTIAL_AT: 100});
export { BigNumber }

let _sessionCache: Array<{ key: string, data: any }> = [];
export const _setCacheItem = (key: string, data: any) => {
	_sessionCache = [
		..._sessionCache.filter((item: { key: string, data: any }) => { return item.key !== key }),
		{ key, data }
	]
}
export const _getCacheItem = (key: string): any | undefined => {
	const foundItem = _sessionCache.find((item: { key: string, data: any }) => { return item.key === key });
	return foundItem?.data || undefined;
}

export const sha256 = async (message: string) => {
	const msgBuffer = new TextEncoder().encode(message);
	const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
	return hashHex;
}

export const combineURLs = (baseURL: string, relativeURL: string) => {
	return relativeURL
		? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
		: baseURL;
}

export const tokenToFloat = (value: BigNumber, decimals?: number): BigNumber => {
	if ( !decimals || decimals === 0 ) { return value; }
	const decimalsToParse = decimals;
	return value.multipliedBy( 10**-decimalsToParse );
}
export const tokenToInt = (value: BigNumber, decimals?: number): BigNumber => {
	const decimalsToParse = decimals || 18;
	return value.multipliedBy( 10**decimalsToParse );
}

export const addThousandSeparator = ( numStr: string ): string => {
	const parts = numStr.split(".");
	return parts[0]
		.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
		+ (parts[1] ? "." + parts[1] : "")
		+ ( numStr.endsWith('.') ? '.' : '' );
}
export const removeThousandSeparator = ( numStr: string ): string => {
	return numStr.replaceAll(',', '.').replaceAll(' ', '');
}

export const compactString = (str: string, chars?: number, saveFirst?: number) => {
	if ( !str ) { return str }
	const useChars = chars || 3;

	str = `${str}`;
	if ( saveFirst && str.length < useChars*2+2+saveFirst ) { return str }
	if ( str.length < useChars*2+2 ) { return str }

	if ( saveFirst ) {
		return `${str.slice(0,useChars+saveFirst)}...${str.slice(-useChars)}`
	}

	return `${str.slice(0,useChars)}...${str.slice(-useChars)}`
}

export const localStorageGet = (key: string): string => {
	let output = null;
	try { output = localStorage.getItem( key ) } catch(ignored) {}
	return output || '';
}
export const localStorageSet = (key: string, value: string): void => {
	try { localStorage.setItem( key, value ) } catch(ignored) {}
}
export const localStorageRemove = (key: string): void => {
	try { localStorage.removeItem( key ) } catch(ignored) {}
}

export const waitUntilAsync = async( condition: () => Promise<boolean>, interval: number, tries: number ) => {
	return await new Promise((resolve, reject) => {
		let currentTry = 0;
		const timer = setInterval(async () => {
			if ( await condition() ) {
				resolve('success');
				clearInterval(timer);
			} else {
				currentTry += 1;
			};

			if ( currentTry >= tries ) {
				clearInterval(timer);
				reject('failed');
			}
		}, interval);
	});
}
export const waitUntil = async( condition: () => boolean, interval: number, tries: number ) => {
	return await new Promise((resolve, reject) => {
		let currentTry = 0;
		const timer = setInterval(() => {
			if ( condition() ) {
				resolve('success');
				clearInterval(timer);
			} else {
				currentTry += 1;
			};

			if ( currentTry >= tries ) {
				clearInterval(timer);
				reject('failed');
			}
		}, interval);
	});
}

export const getNullERC20 = (contractAddress: string) => {
	const assetType = contractAddress === '0x0000000000000000000000000000000000000000' ? _AssetType.native : _AssetType.ERC20;
	return {
		contractAddress,
		assetType,
		icon: default_icon,
		decimals: 0,
		name: compactString(contractAddress),
		symbol: compactString(contractAddress),
		balance: new BigNumber(0),
		allowance: [],
		isSpam: false,
	}
};

export const chainTypeToERC20 = (chain: ChainType): ERC20Type => {
	return {
		contractAddress: '0x0000000000000000000000000000000000000000',
		name: chain.symbol,
		decimals: chain.decimals,
		assetType: _AssetType.native,
		symbol: chain.symbol,
		icon: chain.tokenIcon || chain.networkIcon || default_icon,
		balance: new BigNumber(0),
		allowance: [
			{ allowanceTo: '0x0000000000000000000000000000000000000000', amount: new BigNumber(0), }
		],
	}
}

export const getABI = async (chainId: number, contractAddress: string, typeName: string) => {
	try {
		const localAbi = require(`../abis/${(typeName).toLowerCase() }.json`);
		_setCacheItem('abis', [
			...(_getCacheItem('abis') || []).filter((item: { name: string, aby: any }) => { return item.name.toLowerCase() !== typeName.toLowerCase() }),
			{ name: typeName, abi: localAbi }
		]);
		return localAbi;
	} catch(ignored) {}

	throw new Error(`Cannot load ${chainId}/${contractAddress} abi`);
}
export const createContract = async (web3: Web3, contractType: string, contractAddress: string): Promise<Contract<any>> => {
	const chainId = Number(await web3.eth.getChainId());
	const abi = await getABI(chainId, contractAddress || '', contractType);
	const contract = new web3.eth.Contract(abi as any, contractAddress);
	return contract;
}

export const getStrHash = (str: string): string => {
	const web3 = new Web3();
	const encodedStr = web3.eth.abi.encodeParameter('string', str);
	return web3.utils.keccak256(encodedStr);
}