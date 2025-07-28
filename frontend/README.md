# ETHGlobal. Batchswapper frontend
## Docker Dev Environment with local NGINX
```bash
# Debug app
docker run --rm -it -v $PWD:/app node:18 /bin/bash -c 'cd /app && npm install && chmod -R 777 node_modules'
docker run --rm -it -v $PWD:/app node:18 /bin/bash -c 'cd /app && npm run build'
docker compose  --profile local up

# use this on server for manual run
docker compose  --env-file .env.alpha --profile alpha up -d

############################################
# Debug full node install
docker run --rm -it -v $PWD:/app node:18 /bin/bash -c 'cd /app && npm ci && chmod -R 777 node_modules'

# Debug node buid
docker run --rm  -it -e PUBLIC_URL=/indexpage -e  REACT_APP_URL=localhost:8080   -v $PWD:/app node:18.12.1 /bin/bash    -c 'cd /app && npm run build'
```

http://localhost:8080/