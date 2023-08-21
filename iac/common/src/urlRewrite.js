function handler(event) {
  // This  function is for a viewer request event trigger.
  // Choose viewer request for event trigger when you associate this function with a distribution.
  var request = event.request;           // extract the request object
  var uri = request.uri;                 // extract the URI
  if (uri.startsWith('/app/')) {
    request.uri = uri.replace(/^\/app\//,'/');
  }
  if (uri.startsWith('/api/')) {
    request.uri = uri.replace(/^\/api\//,'/');
  }
  if (uri.startsWith('/api-doc/swagger/')) {
    request.uri = uri.replace(/^\/api-doc\/swagger\//,'/');
  }
  if (uri.startsWith('/api-doc/redoc/')) {
    request.uri = uri.replace(/^\/api-doc\/redoc\//,'/');
  }
  return request;
}
