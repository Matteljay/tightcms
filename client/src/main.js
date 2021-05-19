import Vue from 'vue'
import App from './App.vue'
import { sync } from 'vuex-router-sync'
import store from './store/store'
import router from './router/router'
import markdown_it from 'markdown-it'
import vuetify from './plugins/vuetify'
import VueClipboard from 'vue-clipboard2'

Vue.directive('markdown', (el, binding) => {
    el.innerHTML = markdown_it({
      html: true,
      linkify: true,
      typographer: true,
    }).render(binding.value.replace(/^#/g, '##'))
})

Vue.use(VueClipboard)

Vue.config.productionTip = false
sync(store, router)

const syncFi = async () => {
  // ENTRYPOINT
  // Lots of info is needed to determine the initial router path:
  // - Is there an admin user in the database?
  // - What is the homepage, what are allowed links?
  await store.dispatch('fetchContentData') // store/isLoggedIn
  await store.dispatch('perCheckToken') // store/getNeedWelcome
  new Vue({
    store,
    router,
    vuetify,
    render: h => h(App)
  }).$mount('#app')
}

syncFi()
