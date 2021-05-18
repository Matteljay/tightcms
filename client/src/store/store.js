import Vue from 'vue'
import Vuex from 'vuex'
import ContentData from './modules/ContentData'
import GroupData from './modules/GroupData'
import FileListData from './modules/FileListData'
import Permit from './modules/Permit'

Vue.use(Vuex)

export default new Vuex.Store({
  strict: process.env.NODE_ENV !== 'production',
  state: {
  },
  mutations: {
  },
  actions: {
  },
  modules: {
    ContentData,
    GroupData,
    FileListData,
    Permit,
  },
})
