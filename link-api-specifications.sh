(cd api-specifications && yarn link) &&
(cd backend && yarn link api-specifications) &&
(cd frontend && yarn link api-specifications)