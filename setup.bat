@echo off
cd %~dp0
npm i
cd scripts
npm i
cd ../public_api
npm i
npm run build