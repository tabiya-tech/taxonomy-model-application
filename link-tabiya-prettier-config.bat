@ECHO ON
echo "LINKING TABIYA PRETTIER CONFIG FOR WINDOWS"

:: ********************************************************
:: First unlink to ensure that any previous links is removed
:: ********************************************************
pushd backend
call yarn unlink @tabiya/prettier-config
:: back to the root of the project
popd
pushd frontend
call yarn unlink @tabiya/prettier-config
:: back to the root of the project
popd
pushd api-specifications
call yarn unlink @tabiya/prettier-config
:: back to the root of the project
popd
pushd @tabiya/prettier-config
call yarn unlink
:: back to the root of the project
popd

:: ********************************************************
:: Creates a symbolic link to the config.
:: ********************************************************
pushd @tabiya/prettier-config
call yarn link
:: back to the root of the project
popd
pushd backend
call yarn link @tabiya/prettier-config
:: back to the root of the project
popd
pushd frontend
call yarn link @tabiya/prettier-config
:: back to the root of the project
popd
pushd api-specifications
call yarn link @tabiya/prettier-config
:: back to the root of the project
popd
```