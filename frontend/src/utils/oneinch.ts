
import {
	BigNumber,
	combineURLs
} from "@envelop/envelop-client-core"

export const fetchApprovalForToken = async (chainId: number, tokenAddress: string, walletAddress: string): Promise<BigNumber> => {

	const BASE_URL = process.env.REACT_APP_PROXY_API_BASE_URL;
	if ( !BASE_URL ) {
		console.log('No proxy base url in .env');
		throw new Error('No proxy base url in .env');
	}

	const url = combineURLs(BASE_URL, `/swapproxy/${chainId}/approve/allowance?tokenAddress=${tokenAddress}&walletAddress=${walletAddress}`);

	let respParsed: any;
	try {
		const resp = await fetch(url);

		if ( resp && resp.ok ) {
			respParsed = await resp.json();
		}
	} catch (e) {
		console.log('Cannot load quote', e);
	}

	if ( !respParsed ) {
		console.log('Cannot load quote');
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
		console.log('Cannot load quote', e);
	}

	if ( !respParsed ) {
		console.log('Cannot load quote');
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
	const url = combineURLs(BASE_URL, `/swapproxy/${chainId}/swap?src=${fromTokenAddress}&dst=${toTokenAddress}&amount=${amount}&from=${walletAddress}&origin=${walletAddress}&receiver=${receiver}&slippage=${1}`);

	let respParsed: any;
	try {
		const resp = await fetch(url);

		if ( resp && resp.ok ) {
			respParsed = await resp.json();
		}
	} catch (e) {
		console.log('Cannot load quote', e);
	}

	if ( !respParsed ) {
		console.log('Cannot load quote');
	}

	return respParsed;
}