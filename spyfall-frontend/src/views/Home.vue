<template>
  <div class="home">
    <b-container class="spy-container">
      <div class="text-center">
        <h1>SpyClone</h1>
        <b-form-input class="spy-input" v-if="displayWhen([GAMESTATES.NEW,GAMESTATES.JOIN])"
          v-model="playerName" type="text" placeholder="Enter your name."></b-form-input>
        <b-form-input class="spy-input" v-if="displayWhen([GAMESTATES.JOIN])"
          v-model="accessCode" type="text" placeholder="Enter access code."></b-form-input>
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
            <b-button class="button" @click="setCurrentState(GAMESTATES.WAINTING)">Create</b-button>
          </b-col>
          <b-col cols="6" v-if="displayWhen([GAMESTATES.JOIN])">
            <b-button class="button" @click="setCurrentState(GAMESTATES.WAINTING)">Join</b-button>
          </b-col>
          <b-col cols="6">
            <b-button class="button" @click="setCurrentState(GAMESTATES.INITIAL)">Back</b-button>
          </b-col>
        </b-row>
        <div>
        </div>
        <p>ThisSpyfall designed by Alexandr Ushan, published by Hobby World</p>
      </div>
    </b-container>
    {{currentState}}
  </div>
</template>
<script>
// @ is an alias to /src

import GAMESTATES from '@/constants/gameStates'

export default {
  name: 'home',
  data(){
    return{  
      playerName:'',
      accessCode:'',
      currentState:GAMESTATES.INITIAL,
      GAMESTATES:GAMESTATES
    }
  },
  methods:{
    displayWhen(states){
      return states.indexOf(this.currentState)>-1
    },
    setCurrentState(state){
      this.currentState = state
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
  }
  @media(min-width: 576px){
    .spy-container {
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