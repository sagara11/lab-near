#!/bin/sh

echo ">> Building contract"

near-sdk-js build src/contract.ts build/hello_near.wasm
near-sdk-js build src/donation.ts build/donation.wasm
near-sdk-js build src/contractCall.ts build/contractCall.wasm
