@app
serverless-chat-arc-ts

@ws
default
  src dist/ws/default
connect
  src dist/ws/connect
disconnect
  src dist/ws/disconnect

@shared
src dist/shared

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
  