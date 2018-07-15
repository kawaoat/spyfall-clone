<template>
  <div class="home">
    <b-container class="spy-container">
      <div class="text-center">
        <h1>SpyFall~</h1>
        <b-form-input class="spy-input" v-if="displayWhen([GAMESTATES.NEW,GAMESTATES.JOIN])"
          v-model="playerName" type="text" placeholder="Enter your name."></b-form-input>
        <b-form-input class="spy-input" v-if="displayWhen([GAMESTATES.JOIN])"
          v-model="roomIDInput" type="text" placeholder="Enter access code."></b-form-input>
        <div v-if="displayWhen([GAMESTATES.WAITING])">
          <h3>roomID : {{room.roomID}}</h3>
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
            <b-button class="button" type="submit" @click="joinRoom()">Join</b-button>
          </b-col>
          <b-col cols="6">
            <b-button class="button" type="reset" @click="setCurrentState(GAMESTATES.INITIAL)">Back</b-button>
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
            <div>
  <b-btn v-b-toggle.collapse1 variant="info">Show role</b-btn>
  <b-collapse id="collapse1" class="mt-2">
    <b-card>
      <p class="card-text">You are :{{role}}.</p>
      <p class="card-text" v-if="location" >Location :{{location}}</p>
    </b-card>
  </b-collapse>
</div>

 <b-list-group>
              <b-container>
                <h2>Player</h2>
              <b-row>
              <b-col v-for="player in room.playerList" :key="player.playerID" md="6">
                <b-list-group-item v-if="playerID==player.playerID" variant="secondary" >{{player.playerName}}</b-list-group-item>
                <b-list-group-item v-else>{{player.playerName}}</b-list-group-item>
                
              </b-col>
              </b-row>
              </b-container>
</b-list-group>


            <b-list-group>
              <b-container>
                <h2>Location</h2>
              <b-row>
              <b-col v-for="location in locationList" :key="location.Location" md="6">
                <b-list-group-item>{{location.Location}}</b-list-group-item>
              </b-col>
              </b-row>
              </b-container>
            </b-list-group>
        </div>

        <div v-if="displayWhen([GAMESTATES.VOTING])">
            <div v-if="isSpy()">Voting who is spy! {{getDeltaTime()}}</div>
            <div v-if="!isSpy()">Guess location! {{getDeltaTime()}}</div>
            <div v-if="isNotVoted()">
              <div v-if="isSpy()" v-for="location in locationList" :key="location.Location">
                <b-button class="button w-100" @click="sentSpyAnswer(location.Location)">{{location.Location}}</b-button>
              </div>
              <div  v-if="!isSpy()"  v-for="player in room.playerList" :key="player.playerID">
                <b-button class="button w-100" @click="onVote(player.playerID)">{{player.playerName}} : {{player.voteCounter}}</b-button>
              </div>
            </div>
            <div v-if="!isNotVoted()">Waitng...</div>
        </div>

        <div v-if="displayWhen([GAMESTATES.ENDING])">
            <div>You <strong>{{playerGameResult}}</strong></div>
            <div>Location is <strong>{{room.location}}</strong></div>
            <div>SpyAnswer is {{room.spyAnswer}} ({{(room.spyAnswer==room.location)?'correct':'incorrect'}})</div>
            <!-- <div>The most vote is {{room.mostVotedPlayer}}</div> -->
            
        </div>

      </div>
    </b-container>
    <!-- {{room}} -->
  </div>
</template>
<script>
// @ is an alias to /src
import GAMESTATES from '@/constants/gameStates'
import LocationList from '@/constants/locations'
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
      GAMESTATES:GAMESTATES,
      locationList:LocationList,
      playerID:'',
      socket:null,
      role:'',
      location:'',
      isVoted:false,
      playerGameResult:'',
      roomGameResult:{}
    }
  },
  created() {
    let serverURL = '192.168.180.242:8000'
    // 'localhost:8000'
    this.socket = io(serverURL)
    this.socket.on('connect', () => {
      this.playerID = this.socket.id
      this.socket.on('room',(room)=>{
        this.room = room
        console.log(room)
        if(this.room.gameState === GAMESTATES.PLAYING){
          this.setCurrentState(GAMESTATES.PLAYING)
        }
        else if(this.room.gameState === GAMESTATES.VOTING){
          this.setCurrentState(GAMESTATES.VOTING)
        }
        else if(this.room.gameState === GAMESTATES.ENDING){
          this.setCurrentState(GAMESTATES.ENDING)
        }
      })
      this.socket.on('playerLocationAndRole',data=>{
        this.role = data.role
        this.location = data.location
      })
      this.socket.on('playerGameResult',playerGameResult => {
        this.playerGameResult = playerGameResult
      })
    })
  },
  methods:{
    onReady(){
      this.socket.emit('ready',{roomID:this.room.roomID})
    },
    onVote(votedPlayerID){
      this.isVoted = true
      this.socket.emit('vote',{roomID:this.room.roomID, votedPlayerID })
    },
    sentSpyAnswer(spyAnswer){
      this.isVoted = true
      this.socket.emit('spyAnswer',{roomID:this.room.roomID,spyAnswer})
    },
    getDeltaTime(){
      if(!this.room) return ''
      return Moment(Moment(this.room.endTime )-Moment(this.room.currentTime)).format('mm:ss')
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
    },
    isNotVoted(){
      return !this.isVoted
    },
    isSpy(){
      return this.role=='Spy'
    }
  },
  components: {
  }
}
</script>

<style lang="scss" scoped>
  .spy-container {
    min-height: 320px;
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
    margin: 1rem auto;
  }
  .spy-input {
    margin: 1rem auto;
  }
</style>