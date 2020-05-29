import axios from 'axios'
import router from '@/router/router.js'

const state = {
  token: '',
  userinfo: {},
}

const getters = {
  isLoggedIn: state => !!state.token,
  getToken: state => state.token,
  getUserinfo: state => state.getUserinfo,
}

const mutations = {
  setToken: (state, args) => state.token = args,
  setUserinfo: (state, args) => state.userinfo = args,
}

const actions = {
  async perCheckToken({ commit, dispatch }) {
    // Set and check token
    const token = localStorage.getItem('token')
    if(!token) {
      return
    }
    // Verify this token
    axios.defaults.headers.common['Authorization'] = token
    try {
      await axios.get('/api/permit/')
      // No response: putting userinfo into localStorage decreases backend db lookup
      commit('setToken', token) // validates isLoggedIn
    } catch(err) {
      // Delete if invalid
      dispatch('perLogout')
      // Quietly expire token
      if(err.response.status !== 403) {
        commit('setError', err)
      }
    }
  },
  async perLogin({ commit }, payload) {
    try {
      payload.action = 'login'
      const response = await axios.post('/api/permit/', payload)
      // store response
      const token = response.data.token
      axios.defaults.headers.common['Authorization'] = token
      localStorage.setItem('token', token)
      localStorage.setItem('userinfo', { email: payload.email, username: response.data.username })
      commit('setToken', token)
      commit('setUserinfo', { email: payload.email, username: response.data.username })
      // redirect
      router.replace({ path: '/' }).catch(() => {})
    } catch(err) {
      //console.log(JSON.stringify(err))
      commit('setError', err)
    }
  },
  async perChangePw({ commit, dispatch }, payload) {
    try {
      payload.action = 'changepw'
      const response = await axios.post('/api/permit/', payload)
      // store response
      const token = response.data.token
      axios.defaults.headers.common['Authorization'] = token
      localStorage.setItem('token', token)
      localStorage.setItem('userinfo', { email: payload.email, username: payload.username })
      commit('setToken', token)
      commit('setUserinfo', { email: payload.email, username: payload.username })
      // reboot web app
      await dispatch('fetchContentData') // should trigger 'setNeedWelcome' if this was the first user
      router.replace({ path: '/' }).catch(() => {})
    } catch(err) {
      commit('setError', err)
    }
  },
  perLogout({ commit }) {
    // Delete if invalid
    localStorage.removeItem('token')
    localStorage.removeItem('userinfo')
    delete axios.defaults.headers.common['Authorization']
    commit('setUserinfo', {})
    commit('setToken', '') // triggers template isLoggedIn()
  },
}

export default {
  state,
  getters,
  mutations,
  actions
}
