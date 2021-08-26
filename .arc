@app
test-ws

@ws
# no further config required
# client code is in /public
# serverless code is in /src/ws/*

@http
get /

@tables
chatapp
  id *String
  sortKey **String
  expires TTL

@static
