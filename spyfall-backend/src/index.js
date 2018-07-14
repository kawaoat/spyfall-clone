import Express from 'express'
import Http from 'http'
import Socket from 'socket.io'

const app = Express()
const server = Http.createServer(app)

const PORT = process.env.PORT || 8000
const io = Socket(server)

io.on('connection', socket => {})
server.listen(PORT, () => {
  console.log(`server is on port ${PORT}`)
})
