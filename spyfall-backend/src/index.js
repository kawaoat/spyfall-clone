import Express from 'express'
import Http from 'http'
import Socket from 'socket.io'
import ShortID from 'shortid'
import Lodash from 'lodash'
import GAMESTATES from './constants/gameStates'
import Moment from 'moment'
import Player from './player'
const app = Express()
const server = Http.createServer(app)

const PORT = process.env.PORT || 8000
const io = Socket(server)

let roomList = []
ShortID.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@')

io.on('connection', socket => {
  console.log('connect')
  socket.on('create', data => {
    console.log('create by ', data.playerName)
    let roomID = ShortID.generate()
    createRoom(roomID)
    joinRoom(roomID, socket.id, data.playerName, socket)
    socket.emit('room', getRoomData(roomID))
  })
  socket.on('join', data => {
    console.log(data.playerName, ' join to ', data.roomID)
    joinRoom(data.roomID, socket.id, data.playerName, socket)
    io.emit('room', getRoomData(data.roomID))
  })
  socket.on('ready', data => {
    let checkReady = checkGameIsReady(data.roomID, socket.id)
    if (checkReady) {
      startGame(data.roomID)
    }
    io.emit('room', getRoomData(data.roomID))
  })
  socket.on('vote', data => {
    console.log('vote', data)
  })
})

const createRoom = roomID => {
  roomList.push({
    roomID: roomID,
    gameState: GAMESTATES.WAITING,
    playerList: [],
    gameStartTime: '',
    gameEndTime: ''
  })
}

const startGame = roomID => {
  let room = Lodash.find(roomList, room => room.roomID === roomID)
  room.gameState = GAMESTATES.PLAYING
  room.gameStartTime = Moment()
  let TimelengthInMinutes = 1
  room.gameEndTime = Moment().add(TimelengthInMinutes, 'minutes')
  let interval = setInterval(() => {
    if (room.gameStartTime >= room.gameEndTime) {
      room.gameState = GAMESTATES.VOTING
      room.gameStartTime = Moment() // update time
      Lodash.map(room.playerList, p => {
        p.socket.emit('room', getRoomData(roomID))
      })

      clearInterval(interval)
    } else {
      room.gameStartTime = Moment() // update time
      Lodash.map(room.playerList, p => {
        p.socket.emit('room', getRoomData(roomID))
      })
    }
  }, 1000)
}
const checkGameIsReady = (roomID, playerID) => {
  let room = Lodash.find(roomList, room => room.roomID === roomID)
  if (!room) return
  let player = Lodash.find(room.playerList, p => p.playerID === playerID)
  if (!player) return
  player.isReady = true
  return room.playerList.length === Lodash.filter(room.playerList, p => p.isReady === true).length
}

const joinRoom = (roomID, playerID, playerName, socket) => {
  let room = Lodash.find(roomList, room => room.roomID === roomID)
  if (!room) return
  let player = new Player(playerID, playerName, socket)
  room.playerList.push(player)
}

const getPlayerListByRoomID = roomID => {
  let room = Lodash.find(roomList, room => room.roomID === roomID)
  if (!room) return null
  return room.playerList.map(p => p.getData())
}

const getRoomData = roomID => {
  let room = Lodash.find(roomList, room => room.roomID === roomID)
  return {
    roomID: roomID,
    gameState: room.gameState,
    playerList: getPlayerListByRoomID(roomID),
    gameStartTime: room.gameStartTime,
    gameEndTime: room.gameEndTime
  }
}

server.listen(PORT, () => {
  console.log(`server is on port ${PORT}`)
})
