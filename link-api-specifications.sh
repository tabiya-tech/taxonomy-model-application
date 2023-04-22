# Install dependencies for the 'api-specifications' package, compiles it, and creates a symbolic link to the dist/ folder.
# Then, it links the 'api-specifications' package to the 'backend' and 'frontend' projects.
echo "LINKING API-SPECIFICATIONS FOR LINUX/MACOS"

(cd api-specifications/ && yarn install && yarn run compile && cd dist/ && yarn link) &&
(cd backend && yarn link api-specifications) &&
(cd frontend && yarn link api-specifications)