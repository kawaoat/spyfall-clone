<template>
  <div class="home">
    <b-container class="my-container">
      <b-row class="text-center">
        <b-col md="6">
          <b-button class="button">New game</b-button>
        </b-col>
        <b-col md="6">
          <b-button class="button">Join game</b-button>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>
s
<script>
// @ is an alias to /src

export default {
  name: 'home',
  components: {
  }
}
</script>

<style lang="scss" scoped>
  .my-container {
      border: 1px solid;
  }
  @media(min-width: 576px){
    .my-container {
      max-width: 540px;
    }
  }
  .button{
    margin: 1rem;
  }


</style>
