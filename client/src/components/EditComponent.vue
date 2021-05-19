<template>
  <div class="EditComponent">
    <!-- new article -->
    <div>
      <v-form v-model="validForm" @submit.prevent="submitForm">
        <v-container outlined class="ma-0 pa-0" style="border-collapse:collapse;">
          <v-row no-gutters>
            <v-col cols=8>
              <v-text-field filled clearable label="Article title"
                :value="getEditArticle.title" @input="setEditArticle({key: 'title', val: $event})"
              /> <!-- @click:clear="clearFields()" -->
              <!-- :value="getEditArticle['title']" @input="getEditArticle['title'] = $event"
                won't work with strict store -->
            </v-col>
            <v-col cols=4 class="pl-4">
              <v-select filled label="Format" :items="formatItemOptions"
                :value="getEditArticle.format" @input="setEditArticle({key: 'format', val: $event})"
              />
            </v-col>
          </v-row>
          <v-row no-gutters>
            <v-col>
              <template v-if="getEditArticle.format === 'HTML'">
                <EditButton @eb=taKey icon='fa-bold' hotkey='KeyB' tooltip='Bold font' />
                <EditButton @eb=taKey icon='fa-italic' hotkey='KeyI' tooltip='Italic font' />
                <EditButton @eb=taKey icon='fa-heading' hotkey='KeyH' tooltip='Add heading' />
                <EditButton @eb=taKey icon='fa-image' hotkey='KeyP' tooltip='Add picture' />
                <EditButton @eb=taKey icon='fa-link' hotkey='KeyL' tooltip='Add link' />
                <EditButton @eb=taKey icon='fa-align-center' hotkey='KeyA' tooltip='Center align' />
                <EditButton @eb=taKey icon='fa-font' hotkey='KeyO' tooltip='Font size' />
                <EditButton @eb=taKey icon='fa-palette' hotkey='KeyC' tooltip='Font color' />
                <EditButton @eb=taKey icon='fa-table' hotkey='KeyT' tooltip='Table example' />
                <!-- <EditButton @eb=taKey icon='fa-shapes' hotkey='KeyS' tooltip='Style example' /> -->
                <!-- <v-btn class="mb-1 mr-1" icon v-if="subpages.length"
                  @mousedown.prevent="injectPageLinks()"
                ><v-icon>fa-list-alt</v-icon></v-btn> -- Manual sub link generation -->
              </template>
              <EditButton @eb=taKey icon='fa-cube' hotkey='KeyY' tooltip='Add symbols' />
              <v-btn class="mb-1 mr-1 float-right" v-if="getEditArticle.body" icon
                @mousedown.prevent="clearBody()"
              ><v-icon>fa-times-circle</v-icon></v-btn>
              <!-- <v-btn class="mb-1 mr-1" @mousedown.prevent="injectReplace(genTimeString())" icon><v-icon>fa-calendar-alt</v-icon></v-btn> -->
              <!-- <v-btn class="mb-1 mr-1" color="secondary" @mousedown.prevent="injectReplace(genTimeString())">Time</v-btn> -->
            </v-col>
          </v-row>
          <v-row no-gutters>
            <v-col>
              <v-textarea rows=20 no-resize filled label="Article body" @keydown="taKey" ref="body"
                :value="getEditArticle.body" @input="setEditArticle({key: 'body', val: $event})"
              /> <!-- prop 'auto-grow' creates ugly visual artifacts during render -->
            </v-col>
          </v-row>
          <v-row no-gutters class="justify-end">
            <v-col>
              <v-btn type="submit" class="mb-2 mr-2 float-right" color="success" :disabled="!validForm"
                @mousedown="$event.preventDefault()"
              > <!-- don't ignore click and scroll up with preventDefault -->
                {{ getEditArticle.editorID ? 'Update' : 'Create' }}
              </v-btn>
              <v-btn class="mb-2 mr-2 float-right" color="warning" v-if="getEditArticle.editorID"
                @mousedown.prevent="setEditArticle({ key: 'editorID', val: '' })"
              > <!-- type="reset" -->
                Cancel
              </v-btn>
              <v-btn class="my-1 mr-3 float-right" text icon
                @click="$emit('moveDrop')"
                v-if="!!getMoveArticle && !disabledMover"
              >
                <v-icon>fa-arrow-down</v-icon>
              </v-btn>
            </v-col>
          </v-row>
        </v-container>
      </v-form>
    </div>
    <v-snackbar :timeout=1500 color="error" right top
      @input="snackbarMessage = $event" :value="!!snackbarMessage"
    >
      {{ snackbarMessage }}
      <v-btn dark text @click="snackbarMessage = ''">Cancel</v-btn>
    </v-snackbar>
    <v-dialog scrollable max-width="290px" :value="dialogSymbols" @input="dialogsHide()">
      <v-card>
        <!-- <v-card-title>Select Symbol</v-card-title> -->
        <v-card-text class="pt-4" style="height: 390px;">
          <v-container class="pa-0" fluid>
            <v-row dense v-for="i in Math.ceil(symbols.length/5)" :key="i">
              <v-col v-for="(char, j) in symbols.slice((i-1)*5, i*5)" :key="j">
                <v-card class="text-center title" @click="inject(char, ''); dialogsHide()">
                  {{ char }}
                </v-card>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog max-width="290" :value="dialogLink.show" @input="dialogsHide()">
      <v-card>
        <v-card-title>Add Link</v-card-title>
        <v-card-text>
          <v-text-field  label='URL'
            v-model="dialogLink.url" autofocus /> <!-- @keydown.enter.prevent="$refs.alias.focus()" -->
          <v-text-field @keydown.enter.prevent="addLink()" label='Alias'
            v-model="dialogLink.alias" />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="dialogsHide()">Cancel</v-btn>
          <v-btn color="blue darken-1" text @click="addLink()">Okay</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { mapGetters, mapActions, mapMutations } from 'vuex'
import EditButton from '@/components/EditButton.vue'
const isEmpty = (arg) => !arg || !arg.trim()
export default {
  props: {
    disabledMover: Boolean,
  },
  components: {
    EditButton,
  },
  data() {
    return {
      formatItemOptions: [ 'HTML', 'Markdown', 'Plain Text' ],
      validForm: false,
      //rule_notEmpty: (value) => value.trim().length > 0 || 'Empty value not allowed',
      snackbarMessage: '',
      dialogSymbols: false,
      symbols: '♥₿€£₺₽₹¥¢¤☺ßæœàáâãäåèéêëìíîïðñòóôõöøùúûüýÿÞçšžÆŒÀÁÂÃÄÅÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝŸþÇŠŽ' +
        '¡¿ıºªαβγδεζηθικλμνξπρσςυφχψωΓΔΘΛΞΠΣΦΨΩ™©®§¶†‡•«»' +
        '‰∞±×·÷√∂∫∮≈≠≡≅≝∝≤≥∀∃∈∉ℤℚℝ∧∨∤∥∦⇔⇒←→↔↦↯□⊕¬∩∪⊃⊂ƒ¹²³¼½¾°', //‹›℗…≀≔⊥⊤⊢¦ℕ
      dialogLink: { show: false },
    }
  },
  computed: {
    ...mapGetters(['getEditArticle', 'getCurrentBookLine', 'getMoveArticle']),
  },
  methods: {
    ...mapActions(['addArticle', 'editArticle']),
    ...mapMutations(['setEditArticle']),
    async submitForm() {
      if(isEmpty(this.getEditArticle.title) && isEmpty(this.getEditArticle.body)) {
        this.snackbarMessage = 'Please enter an article title or body'
        return
      }
      if(this.getEditArticle.editorID) {
        await this.editArticle({ ...this.getEditArticle })
      } else {
        await this.addArticle({ ...this.getEditArticle, pageID: this.getCurrentBookLine.page._id })
      }
      // Clear the input
      this.clearFields()
    },
    addLink() {
      this.inject(`<a href="${this.dialogLink.url}">${this.dialogLink.alias}</a>`, '')
      this.dialogsHide()
    },
    dialogsHide() {
      this.dialogSymbols = false
      this.dialogLink.show = false
      this.dialogLink.url = ''
      this.dialogLink.alias = ''
      this.$nextTick(() => this.$refs.body.focus())
    },
    taKey(e) {
      if(e.code === 'Enter') {
        // fix weird input scroll to bottom jumps observed on:
        // Brave Version 1.8.95 Chromium: 81.0.4044.138 64-bit @ Windows 10
        const b = this.$refs.body.$refs.input
        const textLength = this.getEditArticle.body.length
        if(b.selectionStart < textLength) {
          // if you're not appending a return character
          const oldScrollPos = b.scrollTop
          b.onscroll = () => {
            b.scrollTop = oldScrollPos
            b.onscroll = null
          }
        }
      }
      if(e.code === 'Tab') {
        // tab indents cursor in textarea (e.target.value)
        e.preventDefault()
        this.inject('    ', '')
      }
      if(!e.altKey)
        return
      switch(e.code) {
        case 'Enter':
          this.inject('<br />\n', '')
          break
        case 'KeyB':
          this.inject('<b>', '</b>')
          break
        case 'KeyI':
          this.inject('<i>', '</i>')
          break
        case 'KeyH':
          this.inject('<h3>', '</h3>')
          break
        case 'KeyP':
          this.inject('<img src="', '" />')
          break
        case 'KeyL':
          this.dialogLink.show = true
          //this.inject('<a href="', '">link</a>')
          break
        case 'KeyA':
          this.inject('<p style="text-align:center;">', '</p>')
          break
        case 'KeyO':
          this.inject('<span style="font-size:150%;">', '</span>')
          break
        case 'KeyC':
          this.inject('<span style="color:red;">', '</span>')
          break
        case 'KeyT':
          this.append(
            '\n<table width="100%" style="padding:1em;">\n<tr style="vertical-align:top;">\n<td width="50%">',
            '</td>\n<td></td>\n</tr>\n</table>\n')
          break
        case 'KeyY':
          this.dialogSymbols = true
          //this.inject('♥₿°µ€¼½¾‰±≠²àáïôößœèéêë', '')
          break
      }
    },
    clearFields() {
      this.setEditArticle({ key: 'title', val: '' })
      this.setEditArticle({ key: 'body', val: '' })
      this.setEditArticle({ key: 'editorID', val: '' })
    },
    clearBody() {
      this.setEditArticle({ key: 'body', val: '' })
      this.$refs.body.focus()
    },
    // add text to textarea/body, move cursor position
    append(before, after) {
      const b = this.$refs.body.$refs.input
      const text = this.getEditArticle.body
      b.setSelectionRange(text.length, text.length)
      const newText = text + before + after
      document.execCommand('insertText', false, before + after) // fix for firefox
      const newCursorPos = text.length + before.length
      b.setSelectionRange(newCursorPos, newCursorPos)
      this.setEditArticle({key: 'body', val: newText}) // fix for firefox
      this.$refs.body.focus()
      this.$nextTick(() => { // fix for firefox
        // do this too quicky and the cursor will be at the end
        b.setSelectionRange(newCursorPos, newCursorPos)
      })
    },
    // inject text into textarea/body, move cursor position
    inject(before, after) {
      const b = this.$refs.body.$refs.input
      const text = this.getEditArticle.body
      const grab = text.slice(b.selectionStart, b.selectionEnd)
      const newCursorPos = b.selectionStart + before.length
      const newText = text.slice(0, b.selectionStart) + before + grab + after + text.slice(b.selectionEnd) // fix for firefox
      this.$refs.body.focus()
      document.execCommand('insertText', false, before + grab + after)
      b.setSelectionRange(newCursorPos, newCursorPos + grab.length)
      this.setEditArticle({key: 'body', val: newText}) // fix for firefox
      this.$nextTick(() => { // fix for firefox
        // do this too quicky and the cursor will be at the end
        b.setSelectionRange(newCursorPos, newCursorPos + grab.length)
      })
    },
  },
}
</script>
