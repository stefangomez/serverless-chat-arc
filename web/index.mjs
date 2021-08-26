import {websocketURL} from './config.mjs'
// get the web socket url from the backend
let url = websocketURL

// all the DOM nodes this script will mutate
let main = document.getElementsByTagName('main')[0]
let msg = document.getElementById('message')
let roomId =window.location.pathname.slice(1) || 'default';
console.log('roomId', roomId)
// setup the web socket
let ws = new WebSocket(`${url}?roomId=${roomId}`)
ws.onopen = open
ws.onclose = close
ws.onmessage = message
ws.onerror = console.log

// connect to the web socket
function open(res) {
  let ts = new Date(Date.now()).toISOString()
  console.log('open res', res)
  main.innerHTML = `<p><b><code>${ts} - opened</code></b></p>`
}

// report a closed web socket connection
function close() {
  main.innerHTML = 'Closed <a href=/>reload</a>'
}

// write a message into main
function message(e) {
  console.log('message e', e)
  let msg = JSON.parse(e.data)
  main.innerHTML += `<p><b>${msg.sender}</b>&nbsp;<code>${msg.text}</code></p>`
}

// sends messages to the lambda
msg.addEventListener('keyup', function(e) {
  if (e.key == 'Enter') {
    let text = e.target.value // get the text
    e.target.value = ''       // clear the text
    ws.send(JSON.stringify({text, roomId}))
  }
})
