import Express from 'express'
import Http from 'http'
import Socket from 'socket.io'
import ShortID  from 'shortid'
import Lodash from 'lodash'
import { join } from 'path';
const app = Express()
const server = Http.createServer(app)

const PORT = process.env.PORT || 8000
const io = Socket(server)

let roomList = []


io.on('connection', socket => {
  console.log('connect')
  socket.on('create', data => {
    console.log('create by ',data.playerName)
    let roomID = ShortID.generate()
    createRoom(roomID)
    joinRoom(roomID,data.playerName)
    console.log('roomList',roomList)
    socket.emit('room',getRoom(roomID))
  })
  socket.on('join', data => {
    console.log(data.playerName,' join to ',data.roomID)
    joinRoom(data.roomID,data.playerName)
    console.log('roomList',roomList)
    io.emit('room',getRoom(data.roomID))
  })
})

const createRoom = (roomID)=> {
  roomList.push({
    roomID:roomID,
    playerList:[],
  })
}

const joinRoom = (roomID, playerName) => {
  let room = Lodash.find(roomList,room=>room.roomID===roomID)
  if (!room) return
  room.playerList.push({
    playerName
  })
}

const getRoom = (roomID) => {
  let room = Lodash.find(roomList,room=>room.roomID===roomID)
  return room
}

server.listen(PORT, () => {
  console.log(`server is on port ${PORT}`)
})
