<template>
  <div>
    <v-form v-model="validForm" @submit.prevent="submitForm">
      <template v-if="getNeedWelcome">
        <h1 class="mb-2">Welcome to TightCMS</h1>
        <p>Please provide an administrator password</p>
      </template>
      <template v-else>
        <h1 class="mb-2">Change administrator password</h1>
        <v-text-field filled label="Old password" v-model="oldpw"
          :append-icon="show1 ? 'fa-eye' : 'fa-eye-slash'"
          @click:append="show1 = !show1"
          :type="show1 ? 'password' : 'text'"
        />
      </template>
      <v-text-field filled label="New password" v-model="newpw"
        :rules="[newRules.required, newRules.counter]"
        :append-icon="show2 ? 'fa-eye' : 'fa-eye-slash'"
        @click:append="show2 = !show2"
        :type="show2 ? 'password' : 'text'"
      />
      <v-text-field filled label="Repeat new" v-model="repeatpw"
        :rules="[repeatRules.required, repeatRules.matching]"
        :append-icon="show2 ? 'fa-eye' : 'fa-eye-slash'"
        @click:append="show2 = !show2"
        :type="show2 ? 'password' : 'text'"
      />
      <!-- <v-divider /> -->
      <v-btn class="primary mt-2" type="submit" :disabled="!validForm">Send</v-btn>
    </v-form>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import sha256 from 'crypto-js/sha256'
export default {
  data() {
    return {
      show1: true,
      show2: true,
      validForm: false,
      email: 'tightcms@admin.one',
      username: 'Admin',
      oldpw: '',
      newpw: '',
      repeatpw: '',
      newRules: {
        required: value => !!value || 'Required',
        counter: value => value.trim().length > 5 || '6 characters minimum',
        /*email: value => {
          const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
          return pattern.test(value) || 'Invalid e-mail'
        },*/
      },
      repeatRules: {
        required: value => !!value || 'Required',
        matching: value => value === this.newpw || 'Fields must match',
      },
    }
  },
  computed: {
    ...mapGetters(['getNeedWelcome']),
  },
  methods: {
    ...mapActions(['perChangePw']),
    hash(pass) {
      return sha256(this.email.trim() + '^salt^' + pass.trim()).toString()
    },
    submitForm() {
      this.perChangePw({
        email: this.email,
        username: this.username,
        oldpw: this.hash(this.oldpw),
        newpw: this.hash(this.newpw),
        repeatpw: this.hash(this.repeatpw),
      })
    }
  },
}
</script>

