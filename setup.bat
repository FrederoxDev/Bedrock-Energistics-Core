@echo off
cd %~dp0
call npm i
cd scripts
call npm i
cd ../public_api
call npm i
call npm run build