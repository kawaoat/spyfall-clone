import Express from 'express'
import Http from 'http'
import Socket from 'socket.io'
import ShortID from 'shortid'
import Moment, { max } from 'moment'
import Lodash from 'lodash'

import GAMESTATES from './constants/gameStates'
import Locationlist from './constants/locations'
import Player from './player'

import { getRandomInt } from './utils'
const GAME_TIME = 1.5
const app = Express()
const server = Http.createServer(app)

const PORT = process.env.PORT || 8083
const io = Socket(server)

let roomList = []
ShortID.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ@$')

io.on('connection', socket => {
  console.log('connect')
  socket.on('create', data => {
    let roomID = ShortID.generate()
    while (roomID.includes('@') || roomID.includes('$')) {
      console.log('roomID:', roomID, ' >> regenerate.')
      roomID = ShortID.generate()
    }
    roomID = roomID.substring(0, 4)
    createRoom(roomID)
    joinRoom(roomID, socket.id, data.playerName, socket)
    console.log('room', roomID, 'created by', data.playerName)
    socket.emit('room', getRoomData(roomID))
  })
  socket.on('join', data => {
    socket.roomID = data.roomID
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
      let TimelengthInMinutes = GAME_TIME
      room.endTime = Moment().add(TimelengthInMinutes, 'minutes')
      room.currentTime = Moment()
      room.gameState = GAMESTATES.PLAYING
      gameLoop(room.roomID)
    }
    io.emit('room', getRoomData(data.roomID))
  })
  socket.on('vote', data => {
    let room = Lodash.find(roomList, room => room.roomID === data.roomID)
    if (!room) return
    let player = Lodash.find(room.playerList, p => p.playerID === data.votedPlayerID)
    if (!player) return
    player.voteCounter = player.voteCounter + 1

    Lodash.map(room.playerList, p => {
      p.socket.emit('room', getRoomData(room.roomID))
    })
  })
  socket.on('spyAnswer', data => {
    let room = Lodash.find(roomList, room => room.roomID === data.roomID)
    if (!room) return
    console.log('spyAnswer', room.spyAnswer)
    room.spyAnswer = data.spyAnswer
  })
  socket.on('disconnect', data => {
    let room = Lodash.find(roomList, room => room.roomID === socket.roomID)
    if (room) {
      Lodash.remove(room.playerList, p => p.playerID === socket.id)
      let players = Lodash.map(room.playerList, p => p)
      if (players.length <= 0) {
        Lodash.remove(roomList, r => r === room)
      }
    }
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
  var room = {
    roomID: roomID,
    gameState: GAMESTATES.WAITING,
    playerList: [],
    mostVotedPlayer: '',
    spyAnswer: '',
    location: '',
    curentTime: '',
    endTime: '',
    roomInterval: null,
    mostVotedPlayerList: []
  }
  roomList.push(room)
}

const gameLoop = roomID => {
  // let currentRoom = Lodash.find(roomList, room => room.roomID === roomID)
  let interval = setInterval(() => {
    let room = Lodash.find(roomList, room => room.roomID === roomID)
    if (!room) return
    if (room.gameState === GAMESTATES.PLAYING) {
      room.currentTime = Moment()
      if (Moment() >= room.endTime) {
        let TimelengthInMinutes = 1 / 4
        room.endTime = Moment().add(TimelengthInMinutes, 'minutes')
        room.gameState = GAMESTATES.VOTING
        Lodash.map(room.playerList, p => {
          p.socket.emit('room', getRoomData(roomID))
        })
      } else {
        room.currentTime = Moment() // update time
        emitPlayerInRoom(room, 'room', getRoomData(roomID))
      }
    } else if (room.gameState === GAMESTATES.VOTING) {
      if (Moment() >= room.endTime) {
        let maxVoteCounter = 0
        let playerList = room.playerList
        for (let i = 0; i < playerList.length; i++) {
          maxVoteCounter =
						maxVoteCounter > playerList[i].voteCounter ? maxVoteCounter : playerList[i].voteCounter
          if (playerList[i].role !== 'Spy') room.location = playerList[i].location
        }
        room.mostVotedPlayer = Lodash.filter(playerList, p => p.voteCounter === maxVoteCounter)
        room.mostVotedPlayerList = Lodash.map(room.mostVotedPlayer, p => p.getData())
        let VotedSpyPlayer = Lodash.find(room.mostVotedPlayer, p => p.role === 'Spy')
        if (VotedSpyPlayer && room.spyAnswer !== room.location) {
          // Case: spy is the most vote
          room.playerList = Lodash.map(room.playerList, p => {
            if (p.role === 'Spy') p.gameResult = 'Lose'
            else p.gameResult = 'Win'
            return p
          })
        } else {
          room.playerList = Lodash.map(room.playerList, p => {
            if (p.role === 'Spy') p.gameResult = 'Win'
            else p.gameResult = 'Lose'
            return p
          })
        }
        room.gameState = GAMESTATES.ENDING
        Lodash.map(room.playerList, p => {
          console.log('game end')
          p.socket.emit('room', getRoomData(roomID))
          p.socket.emit('playerGameResult', p.getGameResult())
        })
      } else {
        room.currentTime = Moment() // update time
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
    curentTime: room.curentTime,
    endTime: room.endTime,
    location: room.location,
    spyAnswer: room.spyAnswer,
    mostVotedPlayerList: room.mostVotedPlayerList
  }
}

// const getRoomResult = roomID => {
//   let room = Lodash.find(roomList, room => room.roomID === roomID)
//   if (!room) return null
//   return {
//     location: room.location,
//     spyAnswer: room.spyAnswer,
//     mostVotedPlayer: room.mostVotedPlayer
//   }
// }

server.listen(PORT, () => {
  console.log(`server is on port ${PORT}`)
})
