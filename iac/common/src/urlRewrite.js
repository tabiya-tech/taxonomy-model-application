// Using var instead of let as CloudFront functions run on ES5 that does not support const or let.
// noinspection ES6ConvertVarToLetConst

function handler(event) {
  // This  function is for a viewer request event trigger.
  // Choose viewer request for event trigger when you associate this function with a distribution.
  var request = event.request;           // extract the request object
  var uri = request.uri;                 // extract the URI
  if (uri.startsWith('/app/')) {
    request.uri = uri.replace(/^\/app\//,'/');
  }
  if (uri.startsWith('/locales/api/')) {
    request.uri = uri.replace(/^\/locales\/api\//,'/');
  }
  if (uri.startsWith('/taxonomy/api/')) {
    request.uri = uri.replace(/^\/taxonomy\/api\//,'/');
  }
  if (uri.startsWith('/taxonomy/api-doc/swagger/')) {
    request.uri = uri.replace(/^\/taxonomy\/api-doc\/swagger\//,'/');
  }
  if (uri.startsWith('/taxonomy/api-doc/redoc/')) {
    request.uri = uri.replace(/^\/taxonomy\/api-doc\/redoc\//,'/');
  }
  return request;
}
