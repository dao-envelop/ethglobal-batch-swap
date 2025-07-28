import {
	useContext,
	useRef,
	useState
} from "react";

import {
	_AdvancedLoadingStatus,
	_ModalTypes,
	ERC20Context,
	InfoModalContext,
	Web3Context,
} from "../../dispatchers";

import SmartWalletSelector from "../SmartWalletSelector";

export default function BatchSwap() {

	const {
		userAddress,
		currentChain,
		currentChainId,
		web3,
		getWeb3Force,
		balanceNative
	} = useContext(Web3Context);
	const {
		setModal,
		setError,
		setInfo,
		unsetModal,
		setLoading,
		createAdvancedLoader,
		updateStepAdvancedLoader,
	} = useContext(InfoModalContext);
	const {
		erc20List,
		requestERC20Token,
		ERC20Balances,
		updateERC20Balance,
		updateAllBalances,
	} = useContext(ERC20Context);

	const walletBlockRef = useRef(null);
	const [ walletToUse,                     setWalletToUse                     ] = useState('');

	const [ showError,                       setShowError                       ] = useState(false);

	return (
		<main className="s-main">
		<div className="container" ref={ walletBlockRef }>

			<SmartWalletSelector
				onWalletSelect={(wallet) => {
					console.log('wallet selected', wallet);
					setWalletToUse(wallet);
				}}
				showError={ showError && walletToUse === '' }
				callbackAfterCreate={(wallets, created) => {
					if ( !wallets.length ) {
						setInfo(
							'To create indexes:',
							[
								'1. Define the underlying asset and the amount  to use to create an indexes',
								'2. Fill in the count of indexes to create',
								'3. Collect list of the assets with the proportions which indexes will have inside',
								'4. Press Create button and sign the transaction',
							]
						)
					}
				}}
			/>

		</div>
		</main>
	)
}