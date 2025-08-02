
import {
	BigNumber,
	combineURLs
} from "./utils";

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

export const getSwapDataForToken = async (chainId: number, fromTokenAddress: string, toTokenAddress: string, amount: BigNumber, walletAddress: string, toWalletAddress?: string) => {

	const BASE_URL = process.env.REACT_APP_PROXY_API_BASE_URL;
	if ( !BASE_URL ) {
		console.log('No proxy base url in .env');
		throw new Error('No proxy base url in .env');
	}

	const receiver = toWalletAddress || walletAddress;
	const fromTokenAddressToUse = fromTokenAddress === '0x0000000000000000000000000000000000000000' ? '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' : fromTokenAddress;
	const toTokenAddressToUse = toTokenAddress === '0x0000000000000000000000000000000000000000' ? '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' : toTokenAddress;
	const url = combineURLs(BASE_URL, `/swapproxy/${chainId}/swap?src=${fromTokenAddressToUse}&dst=${toTokenAddressToUse}&amount=${amount}&from=${walletAddress}&origin=${walletAddress}&receiver=${receiver}&slippage=${1}&disableEstimate=${true}`);

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
