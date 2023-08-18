function handler(event) {
  // This  function is for a viewer request event trigger.
  // Choose viewer request for event trigger when you associate this function with a distribution.
  const request = event.request;           // extract the request object
  const uri = request.uri;                 // extract the URI
  if (uri.startsWith('/app/')) {
    request.uri = uri.replace(/^\/app\//,'/');
  }
  if (uri.startsWith('/api/')) {
    request.uri = uri.replace(/^\/api\//,'/');
  }
  return request;
}
