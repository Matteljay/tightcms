<template>
  <div>
    <v-form v-model="validForm" @submit.prevent="submitForm">
      <h1 class="mb-2">Sign in</h1>
      <!-- <v-text-field filled label="E-mail" v-model="email" /> -->
      <v-text-field filled label="Password" v-model="password"
        :append-icon="show1 ? 'fa-eye' : 'fa-eye-slash'"
        @click:append="show1 = !show1"
        :type="show1 ? 'password' : 'text'"
      />
      <!-- <v-divider /> -->
      <v-btn class="primary mt-2" type="submit" :disabled="!validForm">Login</v-btn>
    </v-form>
  </div>
</template>

<script>
import { mapActions } from 'vuex'
import sha256 from 'crypto-js/sha256'
export default {
  data() {
    return {
      show1: true,
      validForm: false,
      email: 'tightcms@admin.one',
      password: '',
    }
  },
  methods: {
    ...mapActions(['perLogin']),
    hash(pass) {
      return sha256(this.email.trim() + '^salt^' + pass.trim()).toString()
    },
    submitForm() {
      this.perLogin({ email: this.email, password: this.hash(this.password) })
    }
  },
}
</script>

