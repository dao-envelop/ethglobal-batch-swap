# ETHGlobal. Smart wallet powered by 1inch
[![CI](https://github.com/dao-envelop/ethglobal-batch-swap/actions/workflows/test.yml/badge.svg)](https://github.com/dao-envelop/ethglobal-batch-swap/actions/workflows/test.yml)

## Frontend
React JS app.
### Docker Dev Environment with local NGINX
```shell
$ # Debug app
$ cd frontend
$ docker compose  --profile local up
```
http://localhost:8080/ 
[README](./frontend/README.md)

## API backend
Fast API app, [Documentation](https://apidev.envelop.is/docs)
```shell
$ # Local Dev Environment
$ cd api
$ docker compose --profile local up
```

## Smart contracts
### Deployments  
#### Arbitrum Mainnet 2025-07-30

**ETHGlobalSmartWallet**  
https://arbiscan.io/address/0xc396a63a67b7f569f76fb41501ddc577e895e0a6#code     

**WalletFactory**  
https://arbiscan.io/address/0x779bcc81a45535952e6367438a489c24c5ea13a9#code  

---
### Test
```shell
$ cd smart-wallet
$ forge test
```

