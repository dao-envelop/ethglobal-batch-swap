
import React, {
	ReactNode,
	useContext,
	useEffect,
	useState
} from "react";
import {
	BigNumber,
	ERC20Type,
	chainTypeToERC20,
	combineURLs,
	createAuthToken,
	getERC20Params,
} from "@envelop/envelop-client-core";
import { Web3Context } from "../Web3Dispatcher";

import config from '../../app.config.json';

export type CurrencyRate = {
	contractAddress: string,
	vs_currency: string,
	value: BigNumber,
	source: string,
}

export type CurrencyRateContextType = {
	currencyRates: Array<CurrencyRate>,
	requestERC20CurrencyRate: (contractAddress: string) => Promise<CurrencyRate | null>,
}

export const CurrencyRateContext = React.createContext<CurrencyRateContextType>({
	currencyRates: [],
	requestERC20CurrencyRate: async () => null,
});

export function CurrencyRateDispatcher(props: { children: ReactNode }) {

	const [ currencyRates, setCurrencyRates ] = useState<Array<CurrencyRate>>([]);

	const {
		currentChain,
	} = useContext(Web3Context);

	const fetchCurrencyRate = async ( chainId: number, contractAddress: string ): Promise<CurrencyRate | null> => {

		const authToken = await createAuthToken();
		if ( authToken === '' ) {
			console.log('Cannot create token');
			throw new Error('Cannot create token');
		}
		const BASE_URL = process.env.REACT_APP_ORACLE_API_BASE_URL;
		if ( !BASE_URL ) {
			console.log('No oracle base url in .env');
			throw new Error('No oracle base url in .env');
		}

		const url = combineURLs(BASE_URL, `/token_price/${chainId}/${contractAddress}`);

		let respJson: any;
		try {
			const resp = await fetch(url, {
				headers: {
					'Authorization': authToken,
				}
			});

			if ( resp && resp.ok ) {
				respJson = await resp.json();
			}
		} catch (e) {
			return null;
		}

		if ( !respJson ) {
			return null;
		}

		const respParsed: CurrencyRate = {
			contractAddress: respJson.contract_address,
			value: new BigNumber(respJson.price),
			source: respJson.source,
			vs_currency: 'usd',
		};

		return respParsed;
	}

	const requestERC20CurrencyRate = async (contractAddress: string) => {
		if ( !currentChain ) { return null; }

		const fetchedRate = await fetchCurrencyRate(currentChain.chainId, contractAddress);

		setCurrencyRates((prevState) => {
			if ( fetchedRate === null ) { return prevState; }
			return [
				...prevState.filter((item) => { return item.contractAddress.toLowerCase() !== contractAddress.toLowerCase() }),
				fetchedRate
			]
		});

		return fetchedRate;
	}


	return (
		<CurrencyRateContext.Provider value={{
			currencyRates,
			requestERC20CurrencyRate,
		}}>
			{ props.children }
		</CurrencyRateContext.Provider>
	);
  };