export type ChainType = {
	chainId         : number,
	name            : string,
	colorCode       : string,
	RPCUrl          : string,
	symbol          : string,
	EIPPrefix       : string,
	decimals        : number,
	tokenIcon?      : string,
	networkIcon?    : string,
	isTestNetwork   : boolean,
	explorerBaseUrl : string,
	explorerName    : string,
};
export enum _AssetType {
	empty   =  0,
	native  =  1,
	ERC20   =  2,
	ERC721  =  3,
	ERC1155 =  4
}
export type _Asset = {
	assetType: _AssetType,
	contractAddress: string
}
export type Allowance = {
	allowanceTo: string,
	amount: BigNumber
};
export type ERC20Balance = {
	contractAddress: string,
	balance        : BigNumber,
	allowance?     : Allowance,
}
export interface ERC20Type extends _Asset {
	name     : string,
	symbol   : string,
	decimals : number,
	icon     : string,
	balance  : BigNumber,
	allowance: Array<Allowance>,
}