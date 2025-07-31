### Helpers
```shell
$ # Script for geting hash for storage addresses
$ forge script script/GetStorageSlot.s.sol:GetStorageSlot
```

### Deploy
```shell
 #Deploy
$ forge script script/Deploy.s.sol:ETHGlobalSmartWalletDeployScript --rpc-url arbitrum  --account env_deploy_2025 --sender 0x13B9cBcB46aD79878af8c9faa835Bee19B977D3D --broadcast --verify  --etherscan-api-key $ETHERSCAN_TOKEN 
```