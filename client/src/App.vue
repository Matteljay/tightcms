<template>
  <v-app :style="appStyle">
    <div class="d-flex">
      <div v-if="getDoneLoading" class="mx-auto" :style="computedPageWidth">
        {{ siteSettings() }}
        <v-card>
          <div class="text-center" v-if="getSettings.urlText">
            <img class="d-block" :src="getSettings.urlText" width="100%" />
          </div>
          <!-- manual nav -->
          <div class="d-block pa-2" @click.alt="gotoLogin()"
            :style="`background-color:${getSettings.menuColor}`"
          >
            <template v-for="(bookLine, pageIndex) in getSubsForURL()">
              <MenuButton :bookLine="bookLine" :pageIndex="pageIndex" :key="pageIndex" />
            </template>
            <template v-if="isLoggedIn">
              <v-btn class="ma-1 red darken-1" text :color="getCalcSettings.menuColor_font"
                to="/groupedit">Groups</v-btn>
              <v-btn class="ma-1 red darken-1" text :color="getCalcSettings.menuColor_font"
                to="/settings">Settings</v-btn>
              <v-btn class="ma-1 red darken-1" text :color="getCalcSettings.menuColor_font"
                to="/mediamanage">Media</v-btn>
              <v-btn class="ma-1 red darken-1" text :color="getCalcSettings.menuColor_font"
                to="/logout">Logout</v-btn>
            </template>
          </div>
          <v-main class="pa-2 foreground">
            <v-container>
              <!-- main views get rendered here -->
              <div v-if="!$route">
                <!-- Can happen at location: /test/%25 -->
                <!-- Vue-router bug: https://github.com/vuejs/vue-router/issues/2725 -->
                Page not found, go <a href="/">here</a>
              </div>
              <router-view v-if="$route" :key="$route.path" />
            </v-container>
          </v-main>
          <v-footer padless v-if="!!getSettings.footerText">
            <v-card class="text-center" tile flat width="100%"
              :color="getSettings.footerColor">
              <v-card-text :style="`color:${getCalcSettings.footerColor_font}`">
                {{ getSettings.footerText }}
              </v-card-text>
            </v-card>
          </v-footer>
        </v-card>
      </div>
      <div v-else>
        <v-container>
          TightCMS: connection to the server failed.<br />
          Will refresh and try again every 20 seconds...
          {{ refreshTimer(20000) }}
        </v-container>
      </div>
      <v-snackbar :timeout=10000 :value="!!getError" @input="setError('')" color="error" top>
        {{ getError }}
        <v-btn dark text @click="setError('')">Close</v-btn>
      </v-snackbar>
    </div>
  </v-app>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
import MenuButton from '@/components/MenuButton.vue'
const setFavicon = (url) => {
  const link = document.querySelector("link[rel*='icon']") || document.createElement('link')
  link.type = 'image/x-icon'
  link.rel = 'shortcut icon'
  link.href = url
  document.getElementsByTagName('head')[0].appendChild(link)
}
export default {
  components: {
    MenuButton,
  },
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters(['getSettings', 'getCalcSettings', 'getDoneLoading',
      'getSubsForURL', 'getError', 'isLoggedIn']),
    computedPageWidth() {
      const pgWidth = this.getSettings.pageWidth.toString()
      if(pgWidth.slice(-1) === '%') { // endsWidth('%')
        const settingPct = Number(this.getSettings.pageWidth.slice(0, -1))
        const settingPx = (screen.width * settingPct) / 100
        return `width:${settingPx}px`
      } else {
        return `width:${pgWidth}`
      }
    },
    appStyle() {
      const bgType = this.getSettings.bgType
      const fgType = this.getSettings.fgType
      const bgWithImage = `url(${this.getSettings.bgPath}) center top/${bgType.endsWith('repeat') ?
        'auto repeat' : 'cover no-repeat'} ${bgType.startsWith('Fixed') ? 'fixed' : 'scroll'}`
      const fgWithImage = `url(${this.getSettings.fgPath}) center top/${fgType.endsWith('repeat') ?
        'auto repeat' : 'cover no-repeat'} ${fgType.startsWith('Fixed') ? 'fixed' : 'scroll'}`
      return {
        '--fontFamily': this.getSettings.fontFamily,
        '--fontSize': this.getSettings.fontSize,
        '--listImage': 'circle outside' + (this.getSettings.listImage ? ` url(${this.getSettings.listImage})` : ''),
        '--bgColor': bgType === 'Solid color' ? this.getSettings.bgColor : bgWithImage,
        '--fgColor': fgType === 'Solid color' ? this.getSettings.fgColor : fgWithImage,
      }
    },
  },
  methods: {
    ...mapMutations(['setError']),
    gotoLogin() {
      this.$router.push({ path: '/login' }).catch(() => {})
    },
    siteSettings() {
      this.$vuetify.theme.dark = (this.getCalcSettings.fgColor_font === 'white') /* v-app dark theme fix */
      document.title = this.getSettings.pageTitle
      const root = document.querySelector(':root')
      root.style.fontSize = this.getSettings.fontSize
      setFavicon(this.getSettings.faviconPath)
    },
    refreshTimer(count) {
      setTimeout(() => location.reload(), count) //window.location.replace('/')
    },
  },
}
</script>

<style lang="scss">
//@import '~vuetify/src/styles/styles.sass';
//.pageWidth width: map-get($grid-breakpoints, 'md');
#app {
  //font-family: 'Avenir', Helvetica, Arial, sans-serif;
  //background-color: map-get($yellow, 'lighten-5');
  background: var(--bgColor);
  font-family: var(--fontFamily);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  .foreground {
    background: var(--fgColor);
  }
  .v-input, .v-label {
    font-size: var(--fontSize);
  }
  .primary--text {
    caret-color: var(--fgColor_font) !important;
  }
  a {
    color: inherit;
  }
  hr {
    border-top: 1px solid lightgrey;
    border-bottom: none;
    margin: 1em 0em 1em 0em;
  }
  code {
    background-color: #11111111;
    box-shadow: none;
    color: inherit;
  }
  pre {
    code {
      &::before {
        display: block;
      }
      background-color: transparent;
    }
    background-color: #11111111;
    padding: 0em 1em 0em 1em;
    margin-bottom: 1em;
    box-shadow: none;
  }
  ul {
    list-style: var(--listImage);
  }
}
</style>
