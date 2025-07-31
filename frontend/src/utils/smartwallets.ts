import {
	BigNumber,
	combineURLs,
	createAuthToken,
	createContract,
	ERC20Balance,
	getABI,
	getDefaultWeb3,
	Web3
} from "@envelop/envelop-client-core";

export const createSmartWallet = async (web3: Web3, contractAddress: string, userAddress: string) => {

	const abi = require(`../abis/smartwalletfactory.json`);
	const contract = new web3.eth.Contract(abi as any, contractAddress);

	const tx = await contract.methods.createWalletOnFactory([
		userAddress,
		'',
		'',
		'',
		[],
		[],
		[0,0],
		[]
	]);

	try {
		await tx.estimateGas({ from: userAddress })
	} catch(e) {
		throw e;
	}

	return tx.send({ from: userAddress, maxPriorityFeePerGas: null, maxFeePerGas: null });

}
export const getSmartWalletBalances = async (chainId: number, contractAddress: string): Promise<Array<ERC20Balance>> => {

	return [];

}
export const getSmartWalletTokens = async (chainId: number, contractAddress: string): Promise<Array<string>> => {

	return [];

}

export const getUserSmartWalletsFromAPI = async (
	chainId: number,
	userAddress: string,
) => {

	return [];

}

export const prepareTxTransferERC20Token = async (chainId: number, tokenAddress: string, toAddress: string, amount: BigNumber) => {

	const wnft2vABI = await getABI(chainId, tokenAddress, '_erc20');
	const foundMethod = wnft2vABI.find((item: any) => {
		return item.type.toLowerCase() === 'function' && item.name.toLowerCase() === 'transfer'
	});

	const web3 = await getDefaultWeb3(chainId);
	if ( !web3 ) {
		console.log('Cannot create web3-object');
		return;
	}
	const encodedFunc = web3.eth.abi.encodeFunctionCall(foundMethod, [ toAddress, amount.toString() ]);

	return {
		target: [ tokenAddress ],
		value: [ '0' ],
		data: [ encodedFunc ],
	}

}
export const prepareTxTransferNativeToken = async (chainId: number, toAddress: string, amount: BigNumber) => {

	const web3 = await getDefaultWeb3(chainId);
	if ( !web3 ) {
		console.log('Cannot create web3-object');
		return;
	}

	return {
		target: [ toAddress ],
		value: [ amount.toString() ],
		data: [ '0x' ],
	}

}
export const prepareTxApproveToken = async (chainId: number, tokenAddress: string, toAddress: string, amount: BigNumber) => {

	const wnft2vABI = await getABI(chainId, tokenAddress, '_erc20');
	const foundMethod = wnft2vABI.find((item: any) => {
		return item.type.toLowerCase() === 'function' && item.name.toLowerCase() === 'approve'
	});

	const web3 = await getDefaultWeb3(chainId);
	if ( !web3 ) {
		console.log('Cannot create web3-object');
		return;
	}
	const encodedFunc = web3.eth.abi.encodeFunctionCall(foundMethod, [ toAddress, amount.toString() ]);

	return {
		target: [ tokenAddress ],
		value: [ '0' ],
		data: [ encodedFunc ],
	}

}
export const executeTxBatch = async (
	web3: Web3,
	walletAddress: string,
	userAddress: string,
	data: Array<{ target: Array<string>, value: Array<string>, data: Array<string> }>,
) => {

	const contract = await createContract(web3, 'wnftv2index', walletAddress);
	const argTargets = data.map((item) => { return item.target.flat() }).flat();
	console.log('argTargets', argTargets);
	const argValues = data.map((item) => { return item.value.flat() }).flat();
	console.log('argValues', argValues);
	const argDatas = data.map((item) => { return item.data.flat() }).flat();
	console.log('argDatas', argDatas);

	const tx = await contract.methods.executeEncodedTxBatch(
		argTargets,
		argValues,
		argDatas,
	);

	// try {
	// 	await tx.estimateGas({ from: userAddress })
	// } catch(e) {
	// 	throw e;
	// }

	return tx.send({ from: userAddress, maxPriorityFeePerGas: null, maxFeePerGas: null });

}