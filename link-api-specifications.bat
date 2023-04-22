echo "LINKING API-SPECIFICATIONS FOR WINDOWS"

cd api-specifications/
yarn install
yarn run compile
cd dist/
yarn link
cd ../../backend
yarn link api-specifications
cd ../frontend
yarn link api-specifications
