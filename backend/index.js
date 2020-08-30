const app = require('express')()
const server = require('http').createServer(app)
const io = require('socket.io')(server)

io.on('connection', socket => {
  console.log(`${socket.id} connected`)
  
  socket.on('join', room => {
    socket.join(room)
    socket.room = room
    socket.to(room).emit('join', socket.id)
  })

  socket.on('join-answer', id => {
    socket.to(id).emit('join-answer', socket.id)
  })

  socket.on('signal', ({ to, data }) => {
    socket.to(to).emit('signal', { from: socket.id, data })
  })

  socket.on('disconnect', () => {
    console.log(`${socket.id} disconnected`)
  })
})

const PORT = 8000
server.listen(PORT, () => console.log(`listening on port ${PORT}`))