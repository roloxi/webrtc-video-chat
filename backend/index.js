const app = require('express')()
const server = require('http').createServer(app)
const io = require('socket.io')(server)

io.on('connection', socket => {
  console.log(`${socket.id} connected`)

  socket.on('disconnect', () => {
    console.log(`${socket.id} disconnected`)
  })
})

const PORT = 8000
server.listen(PORT, () => console.log(`listening on port ${PORT}`))