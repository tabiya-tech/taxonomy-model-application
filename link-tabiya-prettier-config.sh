echo "LINKING TABIYA PRETTIER CONFIG FOR LINUX/MACOS"
# First unlink to ensure that any previous link is removed
(cd backend && yarn unlink @tabiya/prettier-config) ;
(cd frontend && yarn unlink @tabiya/prettier-config) ;
(cd api-specifications && yarn unlink @tabiya/prettier-config) ;
(cd locales && yarn unlink @tabiya/prettier-config) ;
(cd @tabiya/prettier-config && yarn unlink) ;
# Create a symbolic link to the config.
(cd @tabiya/prettier-config && yarn link) &&
# Finally, link the package to the 'backend' and 'frontend' and 'api-specifications' projects.
(cd backend && yarn link @tabiya/prettier-config) ;
(cd frontend && yarn link @tabiya/prettier-config) ;
(cd api-specifications && yarn link @tabiya/prettier-config) ;
(cd locales && yarn link @tabiya/prettier-config) ;
