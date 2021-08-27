@app
serverless-chat-arc

@ws
# no further config required
# client code is in /public
# serverless code is in /src/ws/*

@tables
chatapp
  id *String
  sortKey **String
  expires TTL

@indexes
chatapp
  name GSI
  sortKey *String
  createdAt **String
  
@static
