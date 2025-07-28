
import React, {
	ReactNode,
	useContext,
	useEffect,
	useState
} from "react";
import {
	SubscriptionRemainings,
	SubscriptionTariff,
	getTariffsForService,
	getUserTicketForService,
	getRegistryOfService,
	isSubscriptionEnabled,
} from "@envelop/envelop-client-core";
import { Web3Context } from "../Web3Dispatcher";

import config from '../../app.config.json';
import { ERC20Context } from "../ERC20Dispatcher";

export type SubscriptionContextType = {
	registryContract: string,
	agentContract: string,
	serviceContract: string,
	TX_names: { singular: string, plural: string },
	subscriptionRemainings: SubscriptionRemainings | undefined,
	subscriptionTariffs: Array<SubscriptionTariff>,
	updateTicket: Function,
	subscriptionServiceExist: boolean,
}

export const SubscriptionContext = React.createContext<SubscriptionContextType>({
	registryContract: '',
	agentContract: '',
	serviceContract: '',
	TX_names: { singular: 'tx', plural: 'txs' },
	subscriptionRemainings: undefined,
	subscriptionTariffs: [],
	updateTicket: () => {},
	subscriptionServiceExist: true,
});

type SubscriptionDispatcherProps = {
	serviceContract : string,
	TX_names        : { singular: string, plural: string },
	children        : ReactNode
}

export function SubscriptionDispatcher(props: SubscriptionDispatcherProps) {

	const {
		serviceContract,
		TX_names,
	} = props;

	const [ subscriptionServiceExist, setSubscriptionServiceExist ] = useState(true);
	const [ subscriptionRemainings, setSubscriptionRemainings ] = useState<SubscriptionRemainings | undefined>(undefined);
	const [ subscriptionTariffs, setSubscriptionTariffs ] = useState<Array<SubscriptionTariff>>([]);

	const [ agentContract,    setAgentContract    ] = useState('');
	const [ registryContract, setRegistryContract ] = useState('');

	const {
		currentChain,
		userAddress,
	} = useContext(Web3Context);
	const {
		requestERC20Token
	} = useContext(ERC20Context);

	const fetchTicket = async (registryContract: string) => {

		if ( !currentChain ) { return; }
		if ( !userAddress ) { setSubscriptionRemainings(undefined); return; }

		getUserTicketForService(
			currentChain.chainId,
			registryContract,
			serviceContract,
			userAddress,
		)
			.then((data: SubscriptionRemainings | undefined) => {
				if ( !data ) { setSubscriptionRemainings(undefined); return; }

				setSubscriptionRemainings(data);
			})
			.catch((e: any) => {
				console.log('Cannot load remainings', e);
				setSubscriptionRemainings(undefined);
			})
	}

	useEffect( () => {

		const getContracts = async () => {
			if ( !currentChain ) { return; }
			if ( !serviceContract ) { return; }

			const foundChainConfig: any = config.CHAIN_SPECIFIC_DATA.find((item) => { return item.chainId === currentChain.chainId });
			if ( !foundChainConfig ) { return; }
			if ( foundChainConfig.subscriptionAgent === undefined ) { setSubscriptionServiceExist(false); return; }

			const subscriptionEnabled = await isSubscriptionEnabled(currentChain.chainId, serviceContract);
			if ( !subscriptionEnabled ) { setSubscriptionServiceExist(false); return; }

			const _agentContract = foundChainConfig.subscriptionAgent;
			setAgentContract(_agentContract);

			const _registryContract = await getRegistryOfService(currentChain.chainId, serviceContract);
			if ( !_registryContract ) { return; }
			setRegistryContract(_registryContract);

			fetchTariffs(_registryContract, _agentContract);
			fetchTicket(_registryContract);
		}

		const fetchTariffs = async (registryContract: string, _agentContract: string) => {
			if ( !userAddress ) { return; }
			if ( !currentChain ) { return; }

			getTariffsForService(
				currentChain.chainId,
				registryContract,
				_agentContract,
				serviceContract,
			)
				.then((data: Array<SubscriptionTariff>) => {
					if ( !data ) { return; }

					data.forEach((item) => {
						item.payWith.forEach((iitem) => {
							requestERC20Token(iitem.paymentToken);
						})
					})

					setSubscriptionTariffs(data);
				})
		}

		getContracts();

	}, [ currentChain, userAddress, serviceContract ] )

	const updateTicket = () => {
		fetchTicket(registryContract);
	}

	return (
		<SubscriptionContext.Provider value={{
			registryContract,
			agentContract,
			serviceContract,
			TX_names,
			subscriptionRemainings,
			subscriptionTariffs,
			updateTicket,
			subscriptionServiceExist,
		}}>
			{ props.children }
		</SubscriptionContext.Provider>
	);
  };