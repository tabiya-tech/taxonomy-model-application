echo "LINKING API-SPECIFICATIONS FOR LINUX/MACOS"
# First unlink to ensure that any previous link is removed
(cd backend && yarn unlink api-specifications) ;
(cd frontend && yarn unlink api-specifications) ;
(cd api-specifications/ && yarn unlink ; cd dist/ && yarn unlink) ;
# Install dependencies for the 'api-specifications' package, compiles it, and creates a symbolic link to the dist/ folder.
(echo "Build api-specifications" &&  cd api-specifications/ && yarn install && yarn run compile && cd dist/ && yarn link) &&
# Finally, link the 'api-specifications' package to the 'backend' and 'frontend' projects.
(cd backend && yarn link api-specifications) &&
(cd frontend && yarn link api-specifications)