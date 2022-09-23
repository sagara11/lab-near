#!/bin/sh

./build.sh

if [ $? -ne 0 ]; then
  echo ">> Error building contract"
  exit 1
fi

echo ">> Deploying contract"

# https://docs.near.org/tools/near-cli#near-dev-deploy
near dev-deploy --wasmFile build/hello_near.wasm
near dev-deploy --wasmFile build/donation.wasm
near dev-deploy --wasmFile build/contractCall.wasm