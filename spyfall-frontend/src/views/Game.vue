<template>
  <div class="home">
    <b-container class="spy-container">
      <div class="text-center">
        <h1>SpyClone</h1>
        <b-form-input class="spy-input" v-if="displayWhen([GAMESTATES.NEW,GAMESTATES.JOIN])"
          v-model="playerName" type="text" placeholder="Enter your name."></b-form-input>
        <b-form-input class="spy-input" v-if="displayWhen([GAMESTATES.JOIN])"
          v-model="roomIDInput" type="text" placeholder="Enter access code."></b-form-input>
        <div v-if="displayWhen([GAMESTATES.WAITING])">
          <h1>{{room.roomID}}</h1>
          <hr>
          <div v-for="player in room.playerList" :key="player.playerID">{{player.playerName}} isReady:{{player.isReady}}</div>
        </div>
        <b-row v-if="displayWhen([GAMESTATES.INITIAL])">
          <b-col cols="6">
            <b-button class="button" @click="setCurrentState(GAMESTATES.NEW)">New game</b-button>
          </b-col>
          <b-col cols="6">
            <b-button class="button" @click="setCurrentState(GAMESTATES.JOIN)">Join game</b-button>
          </b-col> 
        </b-row>
        <b-row v-if="displayWhen([GAMESTATES.NEW,GAMESTATES.JOIN])">
          <b-col cols="6" v-if="displayWhen([GAMESTATES.NEW])">
            <b-button class="button" @click="createRoom()">Create</b-button>
          </b-col>
          <b-col cols="6" v-if="displayWhen([GAMESTATES.JOIN])">
            <b-button class="button" @click="joinRoom()">Join</b-button>
          </b-col>
          <b-col cols="6">
            <b-button class="button" @click="setCurrentState(GAMESTATES.INITIAL)">Back</b-button>
          </b-col>
        </b-row>
        <b-row v-if="displayWhen([GAMESTATES.WAITING])">
          <b-col cols="6">
            <b-button class="button" @click="onReady()">Ready</b-button>
          </b-col>
          <b-col cols="6">
            <b-button class="button" @click="setCurrentState(GAMESTATES.INITIAL)">Leave</b-button>
          </b-col>
        </b-row>

        <div v-if="displayWhen([GAMESTATES.PLAYING])">
            is playing
            {{getDeltaTime()}}
        </div>


        <div v-if="displayWhen([GAMESTATES.VOTING])">
            Voting who is spy!
            <div v-for="player in room.playerList" :key="player.playerID">
              {{player.playerName}} 
              <b-button class="button" @click="onVote(player.playerID)">Vote</b-button>
            </div>
        </div>

      </div>
    </b-container>
    {{room}}
  </div>
</template>
<script>
// @ is an alias to /src
import GAMESTATES from '@/constants/gameStates'
import io from 'socket.io-client'
import Moment from 'moment'
export default {
  name: 'home',
  data() {
    return{  
      playerName:'',
      room:{},
      roomIDInput:'',
      currentState:GAMESTATES.INITIAL,
      GAMESTATES:GAMESTATES
    }
  },
  created() {
    let serverURL = 'localhost:8000'
    this.socket = io(serverURL)
    this.socket.on('room',(room)=>{
      this.room = room
      if(this.room.gameState === GAMESTATES.PLAYING){
        this.setCurrentState(GAMESTATES.PLAYING)
      }
      else if(this.room.gameState === GAMESTATES.VOTING){
        this.setCurrentState(GAMESTATES.VOTING)
      }
    })
  },
  methods:{
    onReady(){
      this.socket.emit('ready',{roomID:this.room.roomID})
    },
    onVote(playerID){
      this.socket.emit('vote',{playerID})
    },
    getDeltaTime(){
      if(!this.room) return ''
      return Moment(Moment(this.room.gameEndTime )-Moment(this.room.gameStartTime)).format('mm:ss')
    },
    displayWhen(states){
      return states.indexOf(this.currentState)>-1
    },
    setCurrentState(state){
      this.currentState = state
    },
    createRoom(){
      this.socket.emit('create',{"playerName":this.playerName})
      this.setCurrentState(GAMESTATES.WAITING)
    },
    joinRoom(){
      this.socket.emit('join',{"roomID":this.roomIDInput,"playerName":this.playerName})
      this.setCurrentState(GAMESTATES.WAITING)
    }
  },
  components: {
  }
}
</script>

<style lang="scss" scoped>
  .spy-container {
    border: 1px solid;
    border-color: lightgrey;
    border-radius: 16px;
    margin: 10% auto;
    padding-top: 1rem;

    @media(min-width: 576px){
      max-width: 540px;
    }
  }
  .button{
    margin: 1rem;
  }
  .spy-input {
    margin: 1rem auto;
  }
</style>