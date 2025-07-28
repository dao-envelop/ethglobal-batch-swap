import {
	useContext,
	useEffect,
	useState
} from "react";

import {
	Web3Context
} from "../../dispatchers";

import {
	getCurrentEnvironment
} from "../../utils/utils";

import config from '../../app.config.json';

type InfoMessageType = {
	text: string;
	link_url: string;
	link_text: string;
	isClosable: boolean;
	environment?: Array<string>;
}

export default function InfoMessages() {

	const {
		currentChainId,
	} = useContext(Web3Context);

	const [ messages, setMessages ] = useState<Array<InfoMessageType>>([]);

	useEffect(() => {

		const foundChainData = (config as any).CHAIN_SPECIFIC_DATA.find((item: any) => { return item.chainId && item.chainId === currentChainId });

		const currentEnv = getCurrentEnvironment();
		const filteredData = [
			...config.INFO_MESSAGES,
			...(foundChainData?.INFO_MESSAGES || [])
		].filter((item) => { return !item.environment || item.environment.includes(currentEnv) });

		setMessages(filteredData)

	}, [ currentChainId ])

	const getMessagesBlock = () => {
		if ( !messages.length ) { return null; }

		return (
			<div className="s-header-banner" style={{ zIndex: 2 }}>
				<div className="container">
					{ messages.map((item) => { return getMessage(item) }) }
				</div>
			</div>
		)
	}
	const getMessage = (msg: InfoMessageType) => {
		return (
			<div className="content" key={ msg.text }>
				<p>{ msg.text }</p>
				{
					msg.link_url ?
					(<a className="btn btn-sm btn-outline" href={ msg.link_url } target="_blank" rel="noopener noreferrer">{ msg.link_text }</a>) : null
				}

				{
					msg.isClosable ? (
						<button
							className="btn-close"
							onClick={() => {
								setMessages( messages.filter((item) => { return msg.text !== item.text || msg.link_url !== item.link_url }) )
							}}
						>
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path fillRule="evenodd" clipRule="evenodd" d="M15.0274 15.9961L0.000304471 0.736269L0.725342 0L15.7524 15.2599L15.0274 15.9961Z" fill="#141616"></path>
								<path fillRule="evenodd" clipRule="evenodd" d="M0.976641 16L16 0.736446L15.2751 0L0.251784 15.2636L0.976641 16Z" fill="#141616"></path>
							</svg>
						</button>
					) : null
				}
			</div>
		)
	}

	return getMessagesBlock();

}