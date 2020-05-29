<template>
  <div class="LandingPage">
    <h1 class="mb-4">{{ getCurrentBookLine.page.title }}</h1>
    <!-- show subgroups if available -->
    <!-- <table class="mb-3">
      <tr v-for="subBookLine in getSubsForURL(getCurrentBookLine.url)"
        :key="subBookLine.page._id"
      >
        <td shrink>
          <v-btn class="ma-1 greyField" text large width="100%" style="text-transform:none;"
            :to="subBookLine.url"
          >
            {{ subBookLine.page.title }}
          </v-btn>
        </td>
      </tr>
    </table> -->
    <!-- new article -->
    <EditComponent v-if="isLoggedIn" ref="editComp"
      @moveDrop="handleMoveDrop(getCurrentBookLine.page._id)"
      :disabledMover="checkMover(-1)" />
    <!-- page dependent content -->
    <div v-for="(art, i) in currentArticles" :key="art._id"> <!-- :id="'art-' + art._id.substr(-5)" -->
      <v-container class="pl-0 pb-0">
        <v-row class="align-center justify-end">
          <v-col v-if="art.title">
            <h2><a class="anchorLink" :href="getCurrentBookLine.url + '#' + toBars(art.title)"
              @click="copyLink(art.title)" :id="'anchor-' + toBars(art.title)"
            >{{ art.title }}</a></h2>
          </v-col>
          <v-col class="text-right shrink text-no-wrap py-1 my-3 greyField"
            v-if="getSettings.dateDisplay !== 'off' && art.title"
          >
            {{ dateFromMongoID(art._id) }}
          </v-col>
          <!-- admin article buttons: move, copy, del -->
          <v-col class="text-right shrink text-no-wrap" v-if="isLoggedIn">
            <v-btn text icon class="my-1"
              v-if="!getMoveArticle || getMoveArticle === art._id"
              @click="handleMoveRequest(art._id)"
            >
              <v-icon>fa-arrows-alt-v</v-icon>
            </v-btn>
            <v-btn v-else text icon class="my-1"
              :disabled="checkMover(i)"
              @click="handleMoveDrop(art._id)"
            >
              <v-icon>fa-arrow-down</v-icon>
            </v-btn>
            <v-btn text icon class="my-1" @click="handleEdit(art)">
              <v-icon>fa-edit</v-icon>
            </v-btn>
            <v-btn text icon class="my-1" @click="handleClone(art)">
              <v-icon>fa-copy</v-icon>
            </v-btn>
            <v-btn text icon class="my-1" @click="handleDelete(art._id)">
              <v-icon>fa-trash-alt</v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
      <template v-if="art.body">
        <RenderHTML v-if="art.format === 'HTML'" :art="art" />
        <div v-else-if="art.format === 'Markdown'" class="markDown" v-markdown="art.body" />
        <p v-else class="plainText">{{ art.body }}</p>
      </template>
    </div>
    <!-- Scroll up to page top button -->
    <transition name="fab-transition">
      <v-btn fixed z-index=2 fab bottom right
        :color="getSettings.menuColor" :style="`color:${getCalcSettings.menuColor_font}`"
        v-show="showPageUp"
        @click="$vuetify.goTo(0)"
      >
        <v-icon>fa-angle-up</v-icon>
      </v-btn>
    </transition>
    <v-snackbar :timeout=0 :value="!!getMoveArticle" color="secondary" right top>
      Select drop point to move article
      <v-btn dark text @click="setMoveArticle(false)">Cancel</v-btn>
    </v-snackbar>
    <v-snackbar :timeout=1500 color="success" right top
      @input="snackbarMessage = $event" :value="!!snackbarMessage"
    >
      {{ snackbarMessage }}
      <v-btn dark text @click="snackbarMessage = ''">Cancel</v-btn>
    </v-snackbar>
  </div>
</template>

<script>
import EditComponent from '@/components/EditComponent.vue'
import RenderHTML from '@/components/RenderHTML.vue'
import dateFormat from 'dateformat'
import { mapGetters, mapActions, mapMutations } from 'vuex'
export default {
  components: {
    EditComponent,
    RenderHTML,
  },
  data() {
    return {
      showPageUp: false,
      snackbarMessage: '',
    }
  },
  computed: { 
    ...mapGetters(['getCurrentBookLine', 'isLoggedIn', 'getSettings', 'getCalcSettings',
      'getEditArticle', 'getMoveArticle', 'getArticles']),
    currentArticles() { return this.getArticles(this.getCurrentBookLine.page._id) },
  },
  methods: {
    ...mapActions([ 'deleteArticle', 'moveArticle' ]),
    ...mapMutations([ 'setEditArticle', 'setMoveArticle' ]),
    toBars(title) {
      const ret = title.replace(/[^\s\w-]/g, '')
      return ret.replace(/\s+/g, '-').toLowerCase()
    },
    copyLink(title) {
      const simpleTitle = this.toBars(title)
      if(this.isLoggedIn) {
        this.$copyText(this.getCurrentBookLine.url + '#' + simpleTitle)
        this.snackbarMessage = 'Local link copied to clipboard'
      }
      this.$vuetify.goTo('#anchor-' + simpleTitle)
    },
    checkMover(i) {
      return this.currentArticles[i + 1] && this.currentArticles[i + 1]['_id'] === this.getMoveArticle
    },
    handleMoveRequest(id) {
      if(this.getMoveArticle === id) {
        // cancel moving
        this.setMoveArticle('')
      } else {
        this.setMoveArticle(id)
      }
    },
    handleMoveDrop(id) {
      this.moveArticle({ from_id: this.getMoveArticle, to_id: id })
      this.setMoveArticle('')
      //this.$forceUpdate()
    },
    handleEdit(art) {
      this.handleClone(art)
      this.setEditArticle({ key: 'editorID', val: art._id })
    },
    handleClone(art) {
      //this.setEditArticle({ title: art.title, format: art.format, body: art.body })
      //editComp.setFields(art)
      this.setEditArticle({ key: 'title', val: art.title })
      this.setEditArticle({ key: 'format', val: art.format })
      this.setEditArticle({ key: 'body', val: art.body })
      this.$vuetify.goTo(this.$refs.editComp)
    },
    handleDelete(id) {
      if(id === this.getEditArticle.editorID) {
        // end edit-modus if you just deleted the editing-target
        this.setEditArticle({ key: 'editorID', val: '' })
      }
      if(id === this.getMoveArticle) {
        this.setMoveArticle('')
      }
      this.deleteArticle({ id })
    },
    dateFromMongoID(id) {
      const dateFromArticle = new Date(parseInt(id.substring(0, 8), 16) * 1000)
      //return new Date(parseInt(id.substring(0, 8), 16) * 1000)
      //  .toISOString().substring(0, 10)
      return dateFormat(dateFromArticle, this.getSettings.dateDisplay)
    },
  },
  mounted() {
    // trigger scroll-up icon visibility
    window.onscroll = () => {
      this.showPageUp = (window.pageYOffset >= window.innerHeight / 2)
    }
    // move to top or article /link-to#id
    if(this.$route.hash) {
      const scrollTarget = '#anchor-' + this.$route.hash.substr(1)
      if(this.$el.querySelector(scrollTarget)) {
        this.$vuetify.goTo(scrollTarget) // smooth
      } else {
        window.scrollTo(0, 0)
      }
    } else {
      window.scrollTo(0, 0)
    }
  },
}
</script>

<style scoped lang="scss">
.anchorLink {
  text-decoration: none;
}
.plainText {
  white-space: pre-wrap;
  text-align: justify;
}
.markDown {
  text-align: justify;
}
.greyField {
  background-color: #11111111;
  border-radius: 10px;
}
.markDown ::v-deep {
  img {
    max-width: 33%;
  }
  table {
    border-spacing: 0;
    border-collapse: collapse;
    margin-bottom: 1em;
    width: 100%;
    thead tr {
      th, td {
        padding: .2em 1em .2em 0em;
        font-weight: bold;
      }
    }
    tbody tr {
      th, td {
        border-top: 1px solid;
        padding: .2em 1em .2em 0em;
      }
      &:nth-child(odd) {
        th, td {
          background-color: #11111111;
        }
      }
    }
  }
  ol, ul {
    margin-bottom: 1em;
  }
  blockquote {
    border-left: 5px solid;
    padding: 10px 20px;
    margin: 0 0 20px;
    font-size: 110%;
  }
}
</style>
