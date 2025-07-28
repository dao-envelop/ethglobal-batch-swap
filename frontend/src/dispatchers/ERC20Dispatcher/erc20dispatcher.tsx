
import React, {
	ReactNode,
	useContext,
	useEffect,
	useState
} from "react";
import {
	ERC20Balance,
	ERC20Type,
	chainTypeToERC20,
	getERC20BalanceFromChain,
	getERC20Params,
	getNativeBalance,
} from "@envelop/envelop-client-core";
import { Web3Context } from "../Web3Dispatcher";

import config from '../../app.config.json';

export type ERC20ContextType = {
	erc20List         : Array<ERC20Type>,
	ERC20Balances     : Array<{ walletAddress: string, balance: ERC20Balance }>,
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