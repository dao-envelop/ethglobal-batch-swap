
import { FusionSDK } from "@1inch/fusion-sdk";
import {
	BigNumber,
	combineURLs,
	createContract,
	getABI
} from "./utils";

import Web3_4 from "web3-4";
import { ERC20Type } from "./_types";
import {
	AllowanceProvider,
	AllowanceTransfer,
	PERMIT2_ADDRESS,
	PermitSingle,
} from "@uniswap/permit2-sdk";
import { ethers } from "ethers";
import { getDefaultWeb3 } from "../dispatchers/Web3Dispatcher/web3dispatcher";

export const fetchBalanceForToken = async (chainId: number, tokenAddress: string, walletAddress: string): Promise<BigNumber> => {

	const BASE_URL = process.env.REACT_APP_PROXY_API_BASE_URL;
	if ( !BASE_URL ) {
		console.log('No proxy base url in .env');
		throw new Error('No proxy base url in .env');
	}

	const url = combineURLs(BASE_URL, `/balance/${chainId}/${walletAddress}/${tokenAddress}`);

	let respParsed: any;
	try {
		const resp = await fetch(url);

		if ( resp && resp.ok ) {
			respParsed = await resp.json();
		}
	} catch (e) {
		console.log('Cannot load allowance', e);
	}

	if ( !respParsed ) {
		console.log('Cannot load allowance');
	}

	return new BigNumber(respParsed.amount);
}
export const fetchAllowanceForToken = async (chainId: number, tokenAddress: string, walletAddress: string): Promise<BigNumber> => {

	const BASE_URL = process.env.REACT_APP_PROXY_API_BASE_URL;
	if ( !BASE_URL ) {
		console.log('No proxy base url in .env');
		throw new Error('No proxy base url in .env');
	}

	const tokenAddressToUse = tokenAddress === '0x0000000000000000000000000000000000000000' ? '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' : tokenAddress;
	const url = combineURLs(BASE_URL, `/swapproxy/${chainId}/approve/allowance?tokenAddress=${tokenAddressToUse}&walletAddress=${walletAddress}`);

	let respParsed: any;
	try {
		const resp = await fetch(url);

		if ( resp && resp.ok ) {
			respParsed = await resp.json();
		}
	} catch (e) {
		console.log('Cannot load allowance', e);
	}

	if ( !respParsed ) {
		console.log('Cannot load allowance');
	}

	return new BigNumber(respParsed.allowance);
}

export const getApprovalDataForToken = async (chainId: number, tokenAddress: string, amount: BigNumber) => {

	const BASE_URL = process.env.REACT_APP_PROXY_API_BASE_URL;
	if ( !BASE_URL ) {
		console.log('No proxy base url in .env');
		throw new Error('No proxy base url in .env');
	}

	const url = combineURLs(BASE_URL, `/swapproxy/${chainId}/approve/transaction?tokenAddress=${tokenAddress}&amount=${amount}`);

	let respParsed: any;
	try {
		const resp = await fetch(url);

		if ( resp && resp.ok ) {
			respParsed = await resp.json();
		}
	} catch (e) {
		console.log('Cannot load approve calldata', e);
	}

	if ( !respParsed ) {
		console.log('Cannot load approve calldata');
	}

	return respParsed;
}

export const getSwapDataForToken = async (chainId: number, fromTokenAddress: string, toTokenAddress: string, amount: BigNumber, walletAddress: string, toWalletAddress?: string, disableEstimate?: boolean) => {

	const BASE_URL = process.env.REACT_APP_PROXY_API_BASE_URL;
	if ( !BASE_URL ) {
		console.log('No proxy base url in .env');
		throw new Error('No proxy base url in .env');
	}

	const receiver = toWalletAddress || walletAddress;
	const fromTokenAddressToUse = fromTokenAddress === '0x0000000000000000000000000000000000000000' ? '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' : fromTokenAddress;
	const toTokenAddressToUse = toTokenAddress === '0x0000000000000000000000000000000000000000' ? '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' : toTokenAddress;
	const url = combineURLs(BASE_URL, `/swapproxy/${chainId}/swap?src=${fromTokenAddressToUse}&dst=${toTokenAddressToUse}&amount=${amount}&from=${walletAddress}&origin=${walletAddress}&receiver=${receiver}&slippage=${1}&disableEstimate=${disableEstimate}`);

	let resp: any;
	let respParsed: any;
	try {
		resp = await fetch(url);

		if ( resp ) {
			respParsed = await resp.json();
		}
	} catch (e) {
		console.log('Cannot load swap calldata', e);
		throw new Error(`Cannot load swap calldata: ${e}`);
	}

	if ( !respParsed ) {
		console.log('Cannot load swap calldata');
		throw new Error(`Cannot load swap calldata`);
	}

	if ( !resp.ok ) {
		throw new Error(`Cannot load swap calldata: ${respParsed.error}: ${respParsed.description}`);
	}

	return respParsed;
}

export const getRouterAddress = async (chainId: number) => {

	const BASE_URL = process.env.REACT_APP_PROXY_API_BASE_URL;
	if ( !BASE_URL ) {
		console.log('No proxy base url in .env');
		throw new Error('No proxy base url in .env');
	}

	const url = combineURLs(BASE_URL, `/swapproxy/${chainId}/approve/spender`);

	let respParsed: any;
	try {
		const resp = await fetch(url);

		if ( resp && resp.ok ) {
			respParsed = await resp.json();
		}
	} catch (e) {
		console.log('Cannot load swap calldata', e);
	}

	if ( !respParsed ) {
		console.log('Cannot load swap calldata');
	}

	return respParsed.address;
}

export const initFusionSwap = async (chainId: number, fromTokenAddress: string, toTokenAddress: string, amount: BigNumber, userAddress: string, receiver: string) => {

	const fromTokenAddressParsed = fromTokenAddress === '0x0000000000000000000000000000000000000000' ? '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' : fromTokenAddress;
	const toTokenAddressParsed = toTokenAddress === '0x0000000000000000000000000000000000000000' ? '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' : toTokenAddress;

	const BASE_URL = process.env.REACT_APP_PROXY_API_BASE_URL;
	if ( !BASE_URL ) {
		console.log('No proxy base url in .env');
		throw new Error('No proxy base url in .env');
	}

	const web3_4 = new Web3_4((window as any).ethereum);
	const sdk = new FusionSDK({
		url: combineURLs(BASE_URL, `/fusion`),
		network: chainId,
		blockchainProvider: (web3_4.eth as any),
	});

	const params = {
		fromTokenAddress: fromTokenAddressParsed,
		toTokenAddress: toTokenAddressParsed,
		amount: amount.toFixed(0, BigNumber.ROUND_FLOOR),
		walletAddress: userAddress,
		receiver: receiver,
		source: "envelop-ethglobal",
	};

	const quote = await sdk.getQuote(params);
	console.log('quote', quote);

	const preparedOrder = await sdk.createOrder(params);
	console.log('preparedOrder', preparedOrder);

	const info = await sdk.submitOrder(
		preparedOrder.order,
		preparedOrder.quoteId,
	);
	console.log('info', info, info.orderHash);

	return info;
}
export const getFusionSwapStatus = async (chainId: number, orderHash: string) => {

	const BASE_URL = process.env.REACT_APP_PROXY_API_BASE_URL;
	if ( !BASE_URL ) {
		console.log('No proxy base url in .env');
		throw new Error('No proxy base url in .env');
	}

	const web3_4 = new Web3_4((window as any).ethereum);
	const sdk = new FusionSDK({
		url: combineURLs(BASE_URL, `/fusion`),
		network: chainId,
		blockchainProvider: (web3_4.eth as any),
	});

	const info = await sdk.getOrderStatus(orderHash);
	return info;
}