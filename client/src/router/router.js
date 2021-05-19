import Vue from 'vue'
import VueRouter from 'vue-router'
import LandingPage from '../views/LandingPage.vue'
import GroupEdit from '../views/GroupEdit.vue'
import Settings from '../views/Settings.vue'
import MediaManage from '../views/MediaManage.vue'
import Login from '../components/Login.vue'
import Logout from '../components/Logout.vue'
import ChangePass from '../components/ChangePass.vue'
import store from '../store/store.js'

Vue.use(VueRouter)

// Embedded javascript component
//import { compileToFunctions } from 'vue-template-compiler'
//const jsSnip = compileToFunctions('<div>Hello user number {{ 1 + 1 }}</div>').render

const routes = [
  {
    path: '/groupedit',
    name: 'groupedit',
    component: GroupEdit,
    meta: { 
      requiresAuth: true
    },
  },
  {
    path: '/settings',
    name: 'settings',
    component: Settings,
    meta: { 
      requiresAuth: true
    },
  },
  {
    path: '/mediamanage',
    name: 'mediamanage',
    component: MediaManage,
    meta: { 
      requiresAuth: true
    },
  },
  {
    path: '/login',
    name: 'login',
    component: Login,
  },
  {
    path: '/changepass',
    name: 'changepass',
    component: ChangePass,
    meta: { 
      requiresAuth: true
    },
  },
  {
    path: '/logout',
    name: 'logout',
    component: Logout,
    meta: {
      requiresAuth: true
    },
  },
  {
    path: '*',
    name: 'pagina',
    component: LandingPage,
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

router.beforeEach((to, from, next) => {
  if(!store.getters.getDoneLoading) {
    next()
    return
  }
  if(store.getters.getNeedWelcome) {
    if(to.name !== 'changepass') {
      next({ path: '/changepass', replace: true })
      return
    }
  } else {
    // no router access to admin pages
    if(to.meta.requiresAuth) {
      if(!store.getters.isLoggedIn) {
        next({ path: '/login', replace: true })
        return
      }
    } else {
      if(to.name === 'pagina') {
        // check page-request validity
        const bookLine = store.getters.getOrderedURLbook.filter(o => o.url === to.path)[0]
        if(!bookLine) {
          let dest
          if(store.getters.getOrderedURLbook.length) {
            // redirect to homepage (first line in orderedURLbook)
            dest = store.getters.getOrderedURLbook[0].url
          } else {
            dest = store.getters.isLoggedIn ? '/groupedit' : '/login'
          }
          next({ path: dest, replace: true })
          return
        }
        store.commit('setCurrentBookLine', bookLine)
      }
    }
  }
  next()
})

export default router
