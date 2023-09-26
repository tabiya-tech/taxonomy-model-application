@ECHO ON
echo "LINKING TABIYA PRETTIER CONFIG FOR WINDOWS"

:: ********************************************************
:: First unlink to ensure that any previous links is removed
:: ********************************************************
call yarn unlink @tabiya/config-prettier
pushd backend
call yarn unlink @tabiya/config-prettier
:: back to the root of the project
popd
pushd frontend
call yarn unlink @tabiya/config-prettier
:: back to the root of the project
popd
pushd api-specifications
call yarn unlink @tabiya/config-prettier
:: back to the root of the project
popd
pushd @tabiya/config-prettier
call yarn unlink
:: back to the root of the project
popd

:: ********************************************************
:: Creates a symbolic link to the config.
:: ********************************************************
pushd @tabiya/config-prettier
call yarn link
:: back to the root of the project
popd
call yarn link @tabiya/config-prettier
pushd backend
call yarn link @tabiya/config-prettier
:: back to the root of the project
popd
pushd frontend
call yarn link @tabiya/config-prettier
:: back to the root of the project
popd
pushd api-specifications
call yarn link @tabiya/config-prettier
:: back to the root of the project
popd
```