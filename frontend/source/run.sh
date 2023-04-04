# changing the verions    
sed -i -e "s|\###date###|$(date -u +%F' %T.%3N UTC')|g" app.html
sed -i -e "s|\###GITHUB_REF_NAME###|$GITHUB_REF_NAME|g" app.html
sed -i -e "s|\###GITHUB_RUN_NUMBER###|$GITHUB_RUN_NUMBER|g" app.html
sed -i -e "s|\###GITHUB_SHA###|$GITHUB_SHA|g" app.html