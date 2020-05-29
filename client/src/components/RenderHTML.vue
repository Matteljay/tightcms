<template>
  <div class="htmlDiv" v-html="art.body"></div>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  props: {
    art: Object,
  },
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters([ 'getOrderedURLbook', 'getCurrentBookLine', 'getSubsForURL', 'getArticles' ]),
    currentArticles() { return this.getArticles(this.getCurrentBookLine.page._id) },
  },
  methods: {
    toBars(title) {
      const ret = title.replace(/[^\s\w-]/g, '')
      return ret.replace(/\s+/g, '-').toLowerCase()
    },
    dynamicRender() {
      // live page links
      const livePageEL = this.$el.querySelector('[id="LivePages" i')
      if(livePageEL) {
        livePageEL.removeAttribute('id')
        let addedPage = false
        for(let subBookLine of this.getSubsForURL(this.getCurrentBookLine.url)) {
          const clone = livePageEL.cloneNode(false)
          clone.innerHTML = '<a href="' + subBookLine.url + '">' + subBookLine.page.title + '</a>'
          livePageEL.parentNode.insertBefore(clone, livePageEL) //liveArtEL.parentNode.appendChild(clone)
          addedPage = true
        }
        if(addedPage) {
          livePageEL.remove()
        } else {
          livePageEL.innerHTML = '<a href="javascript:void(0)">LivePages placeholder</a>'
        }
      }
      // live article link index
      const liveArtELS = this.$el.querySelectorAll('[id="LiveArticles" i')
      if(liveArtELS.length) {
        const liveArtFirst = liveArtELS[0]
        const liveArtParent = liveArtFirst.parentNode
        for(let i = 1; i < liveArtELS.length; i++) {
          liveArtELS[i].remove()
        }
        let addedLink = false
        for(let genArt of this.currentArticles) {
          if(!genArt.title) continue
          if(genArt._id === this.art._id) continue
          const clone = liveArtFirst.cloneNode(false)
          clone.innerHTML = '<a href="' + this.getCurrentBookLine.url
            + '#' + this.toBars(genArt.title) + '">' + genArt.title + '</a>'
          liveArtParent.insertBefore(clone, liveArtFirst)
          addedLink = true
        }
        if(addedLink) {
          liveArtFirst.remove()
        } else {
          liveArtFirst.innerHTML = '<a href="javascript:void(0)">LiveArticles placeholder</a>'
        }
      }
      // client-side link routing
      for(let link of this.$el.querySelectorAll('a')) {
        if(link.pathname.charAt(0) === '/') {
          // just scroll if the url links to the current page
          if(link.pathname === this.getCurrentBookLine.url) {
            link.addEventListener('click', (e) => {
              const scrollTarget = '#anchor-' + link.hash.substr(1)
              if(document.querySelector(scrollTarget)) {
                this.$vuetify.goTo(scrollTarget) // smooth
              } else {
                window.scrollTo(0, 0)
              }
              e.preventDefault()
            })
          } else {
            // use client-side routing if the local url is valid
            if(this.getOrderedURLbook.filter(o => o.url === link.pathname).length) {
              link.addEventListener('click', (e) => {
                this.$router.push(link.pathname + link.hash).catch(() => {})
                e.preventDefault()
              })
            }
          }
        }
      }
    },
  },
  updated() {
    this.dynamicRender()
  },
  mounted() {
    this.dynamicRender()
  },
}
</script>

<style scoped lang="scss">
.htmlDiv {
  margin-bottom: 1em;
  overflow: hidden;
}
.htmlDiv ::v-deep {
  img {
    max-width: 100%;
  }
}
</style>
