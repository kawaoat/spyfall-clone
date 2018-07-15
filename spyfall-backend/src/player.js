export default class Player {
  constructor (playerID, playerName, socket) {
    this.socket = socket
    this.playerID = playerID
    this.playerName = playerName
    this.isReady = false
  }

  getData () {
    return {
      playerID: this.playerID,
      playerName: this.playerName,
      isReady: this.isReady
    }
  }
}
