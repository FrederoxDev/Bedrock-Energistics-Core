#!/bin/bash
set +x
cd "$(dirname -- "${BASH_SOURCE[0]}")" || exit
npm i
cd scripts
npm i
cd ../public_api
npm i
npm run build