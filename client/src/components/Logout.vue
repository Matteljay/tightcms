<template>
  <div>
    <h3>{{ msg }}</h3>
  </div>
</template>

<script>
import { mapActions } from 'vuex'
export default {
  data() {
    return {
      msg: 'Logging out...'
    }
  },
  methods: {
    ...mapActions(['perLogout']),
  },
  mounted() {
    setTimeout(() => {
      this.perLogout()
      this.msg = 'Logged out'
      this.$router.replace({ path: '/' }).catch(() => {})
    }, 1000)
  },
}
</script>
