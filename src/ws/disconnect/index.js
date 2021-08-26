let arc = require('@architect/functions')

/**
 * used to clean up event.requestContext.connectionId
 */
exports.handler = async function ws(event) {
  console.log('ws-disconnect called with', event)
  let message = JSON.parse(event.body || "{}")
  let connectionId = event.requestContext.connectionId
  let roomId = message?.roomId || 'default'

  let data = await arc.tables()
  await data.chatapp.delete({id: `room#${roomId}`, sortKey: `listeners#${connectionId}` })
  return {statusCode: 200}
}
