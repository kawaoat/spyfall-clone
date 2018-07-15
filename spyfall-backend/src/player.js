export default class Player {
  constructor (playerID, playerName, socket) {
    this.socket = socket
    this.playerID = playerID
    this.playerName = playerName
    this.isReady = false
    this.role = ''
    this.location = ''
    this.voteCounter = 0
  }

  getData () {
    return {
      playerID: this.playerID,
      playerName: this.playerName,
      isReady: this.isReady,
      voteCounter: this.voteCounter
    }
  }

  getLocationAndRole () {
    return {
      role: this.role,
      location: this.location
    }
  }
}
