echo "LINKING API-SPECIFICATIONS FOR WINDOWS"

:: ********************************************************
:: First unlink to ensure that any previous links is removed
:: ********************************************************
pushd backend/
yarn unlink api-specifications
:: back to the root of the project
popd
pushd frontend/
yarn unlink api-specifications)
:: back to the root of the project
popd
pushd api-specifications/
yarn unlink
cd dist/
yarn unlink
:: back to the root of the project
popd

:: ********************************************************
:: Install dependencies for the 'api-specifications' package,
:: compiles it, and creates a symbolic link to the dist/ folder.
:: ********************************************************

pushd api-specifications/
yarn install
yarn run compile
cd dist/
yarn link
:: back to the root of the project
popd

:: ********************************************************
:: Finally, link the 'api-specifications' package
:: to the 'backend' and 'frontend' projects.
:: ********************************************************
pushd backend/
yarn link api-specifications
:: back to the root of the project
popd
pushd frontend/
yarn link api-specifications
:: back to the root of the project
popd
