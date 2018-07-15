import Express from 'express'
import Http from 'http'
import Socket from 'socket.io'
import ShortID from 'shortid'
import Moment from 'moment'
import Lodash from 'lodash'

import GAMESTATES from './constants/gameStates'
import Locationlist from './constants/locations'
import Player from './player'

import { getRandomInt } from './utils'
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
      let room = Lodash.find(roomList, room => room.roomID === data.roomID)
      if (!room) return
      assignLocationToRoom(room)
      Lodash.map(room.playerList, p => {
        p.socket.emit('playerLocationAndRole', p.getLocationAndRole())
      })
      // startGame(data.roomID)
      let TimelengthInMinutes = 1
      room.stateEndTime = Moment().add(TimelengthInMinutes, 'minutes')
      room.stateStartTime = Moment()
      room.gameState = GAMESTATES.PLAYING
      gameLoop(room.roomID)
    }
    io.emit('room', getRoomData(data.roomID))
  })
  socket.on('vote', data => {
    console.log('vote', data)
  })
})

const assignLocationToRoom = room => {
  let locationAndRole = getRandomLocationAndRole()
  assignLocationAndRolePlayerInRoom(room, locationAndRole)
}

const assignLocationAndRolePlayerInRoom = (room, locationAndRole) => {
  let spyIndex = getRandomInt(room.playerList.length)
  let location = locationAndRole.Location
  let roles = locationAndRole.Roles
  Lodash.map(room.playerList, p => {
    p.role = getRandomRole(roles)
    p.location = location
  })
  room.playerList[spyIndex].role = 'Spy'
  room.playerList[spyIndex].location = ''
}

const getRandomLocationAndRole = () => {
  let randInt = getRandomInt(Locationlist.length)
  return Locationlist[randInt]
}

const getRandomRole = roles => {
  let randInt = getRandomInt(roles.length)
  return roles[randInt]
}

const createRoom = roomID => {
  roomList.push({
    roomID: roomID,
    gameState: GAMESTATES.WAITING,
    playerList: [],
    stateStartTime: '',
    stateEndTime: ''
  })
}

const gameLoop = roomID => {
  let interval = setInterval(() => {
    let room = Lodash.find(roomList, room => room.roomID === roomID)
    if (room.gameState == GAMESTATES.PLAYING) {
      if (Moment() >= room.stateEndTime) {
        let TimelengthInMinutes = 1 / 12
        room.stateEndTime = Moment().add(TimelengthInMinutes, 'minutes')
        room.stateStartTime = Moment() // update time
        room.gameState = GAMESTATES.VOTING
        Lodash.map(room.playerList, p => {
          p.socket.emit('room', getRoomData(roomID))
        })
      } else {
        room.stateStartTime = Moment() // update time
        emitPlayerInRoom(room, 'room', getRoomData(roomID))
      }
    } else if (room.gameState == GAMESTATES.VOTING) {
      if (Moment() >= room.stateEndTime) {
        room.gameState = GAMESTATES.ENDING
        Lodash.map(room.playerList, p => {
          p.socket.emit('room', getRoomData(roomID))
        })
      } else {
        room.stateStartTime = Moment() // update time
        emitPlayerInRoom(room, 'room', getRoomData(roomID))
      }
    } else if (room.gameState === GAMESTATES.ENDING) {
      console.log('end')
      Lodash.map(room.playerList, p => {
        p.socket.emit('room', getRoomData(roomID))
      })
      clearInterval(interval)
    }
  }, 900)
}

const startGame = roomID => {
  let room = Lodash.find(roomList, room => room.roomID === roomID)
  room.gameState = GAMESTATES.PLAYING
  room.stateStartTime = Moment()
  let TimelengthInMinutes = 1 / 12
  room.stateEndTime = Moment().add(TimelengthInMinutes, 'minutes')
  let interval = setInterval(() => {
    if (Moment() >= room.stateEndTime) {
      room.gameState = GAMESTATES.VOTING
      Lodash.map(room.playerList, p => {
        p.socket.emit('room', getRoomData(roomID))
      })

      clearInterval(interval)
    } else {
      room.stateStartTime = Moment() // update time
      emitPlayerInRoom(room, 'room', getRoomData(roomID))
    }
  }, 900)
}
const checkGameIsReady = (roomID, playerID) => {
  let room = Lodash.find(roomList, room => room.roomID === roomID)
  if (!room) return
  let player = Lodash.find(room.playerList, p => p.playerID === playerID)
  if (!player) return
  player.isReady = true
  return room.playerList.length === Lodash.filter(room.playerList, p => p.isReady === true).length
}

const emitPlayerInRoom = (room, event, data) => {
  Lodash.map(room.playerList, p => {
    p.socket.emit(event, data)
  })
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
  if (!room) return
  return {
    roomID: roomID,
    gameState: room.gameState,
    playerList: getPlayerListByRoomID(roomID),
    stateStartTime: room.stateStartTime,
    stateEndTime: room.stateEndTime
  }
}

server.listen(PORT, () => {
  console.log(`server is on port ${PORT}`)
})
