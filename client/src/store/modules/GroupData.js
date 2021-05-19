import axios from 'axios'

const actions = {
    async postGroupOperation({ dispatch, commit }, payload) {
        //console.log(`[STORE] postGroupOperation ${JSON.stringify(payload)}`)
        try {
            payload.type = 'group'
            await axios.post('/api/content/', payload)
            await dispatch('fetchContentData')
        } catch(err) {
            commit('setError', err)
        }
    },
}

export default {
    //state,
    //getters,
    //mutations,
    actions
}
