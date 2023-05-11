@ECHO ON
echo "LINKING API-SPECIFICATIONS FOR WINDOWS"

:: ********************************************************
:: First unlink to ensure that any previous links is removed
:: ********************************************************
pushd backend
call yarn unlink api-specifications
:: back to the root of the project
popd
pushd frontend
call yarn unlink api-specifications
:: back to the root of the project
popd
pushd api-specifications
call yarn unlink
cd dist
call yarn unlink
:: back to the root of the project
popd

:: ********************************************************
:: Install dependencies for the 'api-specifications' package,
:: compiles it, and creates a symbolic link to the dist/ folder.
:: ********************************************************

pushd api-specifications
call yarn install
call yarn run compile
cd dist
call yarn link
:: back to the root of the project
popd

:: ********************************************************
:: Finally, link the 'api-specifications' package
:: to the 'backend' and 'frontend' projects.
:: ********************************************************
pushd backend
call yarn link api-specifications
:: back to the root of the project
popd
pushd frontend
call yarn link api-specifications
:: back to the root of the project
popd
