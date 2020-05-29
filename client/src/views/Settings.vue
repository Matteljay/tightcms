<template>
  <div class="Settings">
    <h1>Settings</h1>
    <div class="ma-6">
      <v-card class="transparent px-6 pt-2">
        <v-text-field label="Web page title"
          :value="getSettings.pageTitle"
          @input="debounceSettingChanged('pageTitle', $event)"
        />
      </v-card>
      <v-card class="transparent px-6 pt-2">
        <v-text-field label="Path to website icon"
          :value="getSettings.faviconPath"
          @input="debounceSettingChanged('faviconPath', $event)"
        />
      </v-card>
      <v-card class="transparent px-6 pt-2">
        <v-text-field label="Path to header image"
          :value="getSettings.urlText"
          @input="debounceSettingChanged('urlText', $event)"
        />
      </v-card>
      <v-card class="transparent px-6 pt-2">
        <v-text-field
          :value="'Menu color ' + getSettings.menuColor"
          :readonly="true"
          @click.stop="dialogColorShow('menuColor', 'Menu color')"
        />
      </v-card>
      <v-card class="transparent px-6 pt-2">
        <v-select label="Preferred page width"
          :value="getSettings.pageWidth"
          @input="settingChanged('pageWidth', $event)"
          :items="pageWidthOptions"
        />
      </v-card>
      <v-card class="transparent px-6 pt-2">
        <v-container class="pa-0" >
          <v-row no-gutters>
            <v-col cols="8">
              <v-select label='Global font'
                :value="getSettings.fontFamily"
                @input="settingChanged('fontFamily', $event)"
                :items="fontFamilyOptions"
              />
            </v-col>
            <v-col class="ml-2">
              <v-select label='Size'
                :value="getSettings.fontSize"
                @input="settingChanged('fontSize', $event)"
                :items="fontSizeOptions"
              />
            </v-col>
          </v-row>
        </v-container>
      </v-card>
      <v-card class="transparent px-6 pt-2">
        <v-select label="Article date display"
          :value="getSettings.dateDisplay"
          @input="settingChanged('dateDisplay', $event)"
          :items="dateDisplayOptions"
        />
      </v-card>
      <v-card class="transparent px-6 pt-2">
        <v-text-field label="Small unordered-list image (20x20 px)"
          :value="getSettings.listImage"
          @input="debounceSettingChanged('listImage', $event)"
        />
      </v-card>
      <!-- slider setting example, don't use for pageWidth unless you're a bored cat -->
      <!-- <v-card class="transparent px-6 pt-5">
        <v-slider
          label="Page width"
          :value="getSettings.pageWidth"
          @input="settingChanged('pageWidth', $event)"
          min="20"
          max="100"
          step="5"
          tick-size="4"
          ticks="always"
        />
      </v-card> -->
      <v-card class="transparent px-6 pt-2">
        <v-text-field
          :value="`Background: ${getSettings.bgType}: ${getSettings.bgType === ('Solid color') ?
            getSettings.bgColor : getSettings.bgPath}`"
          :readonly="true"
          @click.stop="$refs.colorImage.show(
            { title: 'Background', type: 'bgType', color: 'bgColor', path: 'bgPath' })"
        />
      </v-card>
      <v-card class="transparent px-6 pt-2">
        <v-text-field
          :value="`Foreground: ${getSettings.fgType}: ${getSettings.fgType === ('Solid color') ?
            getSettings.fgColor : getSettings.fgPath}`"
          :readonly="true"
          @click.stop="$refs.colorImage.show(
            { title: 'Foreground', type: 'fgType', color: 'fgColor', path: 'fgPath' })"
        />
      </v-card>
      <v-card class="transparent px-6 pt-2">
        <v-text-field
          :value="'Footer color ' + getSettings.footerColor"
          :readonly="true"
          @click.stop="dialogColorShow('footerColor', 'Footer color')"
        />
      </v-card>
      <v-card class="transparent px-6 pt-2">
        <v-text-field label="Footer text"
          :value="getSettings.footerText"
          @input="debounceSettingChanged('footerText', $event)"
        />
      </v-card>
      <v-card class="transparent px-6 pt-2">
        <v-text-field
          :value="'TightCMS v' + getVersion() + ' - Matteljay@pm.me'"
          :readonly="true"
          @click="copyBTC()"
        /> 
      </v-card>
    </div>
    <v-snackbar :timeout=4000 v-model="snackbar_copied" color="success" right top>
      Bitcoin donation address copied to clipboard
      <v-btn dark text @click="snackbar_copied = false">Close</v-btn>
    </v-snackbar>
    <v-snackbar :timeout=1500 v-model="snackbar" color="success" right top>
      Saving
      <v-btn dark text @click="snackbar = false">Close</v-btn>
    </v-snackbar>
    <v-dialog overlay-opacity="0" max-width="290px"
      :value="dialogColor.show" @input="hideDialogColor()"
    >
      <v-card>
        <v-card-title>{{ dialogColor.title }}</v-card-title>
        <v-card-text>
          <v-color-picker hide-mode-switch
            :value="getSettings[dialogColor.key]"
            @input="setSetting({key: dialogColor.key, val: $event})"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text
            @click="hideDialogColor()">Cancel</v-btn>
          <v-btn color="blue darken-1" text
            @click="saveDialogColor()">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <SettingColorImage ref="colorImage" @showSnack="snackbar=true" />
  </div>
</template>

<script>
import { mapGetters, mapActions, mapMutations } from 'vuex'
import SettingColorImage from '@/components/SettingColorImage.vue'
export default {
  components: {
    SettingColorImage,
  },
  data() {
    return {
      debounceTimer: {},
      dialogColor: { show: false },
      snackbar: false,
      snackbar_copied: false,
      //pageWidthOptions: [...Array(17).keys()].map(i => (i+4) * 5 + '%'),
      pageWidthOptions: [ '600px', '960px', '1264px', '1904px',
        '30%', '35%', '40%', '45%', '50%', '55%', '65%', '70%', '75%', '80%', '85%', '90%', '95%', '100%' ],
      dateDisplayOptions: [
        { text: 'off', value: 'off' },
        { text: '2019-04-03', value: 'yyyy-mm-dd' },
        { text: '2019 April 3', value: 'yyyy mmmm d' },
        { text: '3 April 2019', value: 'd mmmm yyyy' },
        { text: 'April 3rd, 2019', value: 'mmmm dS, yyyy' }
      ],
      fontFamilyOptions: [
        'Arial', 'Roboto', 'Times New Roman', 'Times', 'Courier New', 'Courier', 'Verdana', 'Georgia',
        'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS', 'Candara', 'Arial Black', 'Impact',
      ],
      fontSizeOptions: [ '10px', '12px', '13px', '14px', '15px', { text: '16px (default)', value: '16px' },
        '18px', '20px', '21px', '26px' ],
    }
  },
  computed: { ...mapGetters(['getSettings']), },
  methods: {
    ...mapActions(['commitSettings']),
    ...mapMutations(['setSetting']),
    dialogColorShow(key, title) {
      this.dialogColor = { show: true, key, title, resetValue: this.getSettings[key] }
    },
    saveDialogColor() {
      this.settingChanged(this.dialogColor.key, this.getSettings[this.dialogColor.key])
      this.dialogColor.show = false
    },
    hideDialogColor() {
      this.setSetting({key: this.dialogColor.key, val: this.dialogColor.resetValue})
      this.dialogColor.show = false
    },
    debounceSettingChanged(key, val) {
      if(this.debounceTimer.key)
        clearTimeout(this.debounceTimer.key)
      this.debounceTimer.key = setTimeout(() => this.settingChanged(key, val), 1500)
    },
    settingChanged(key, val) {
      //console.log(`key: ${key} val: ${val}`)
      this.setSetting({key, val}) //this.$store.commit('setSetting', {key, val})
      this.commitSettings()
      this.snackbar = true
    },
    copyBTC() {
      this.snackbar_copied = true
      this.$copyText('14VZcizduTvUTesw4T9yAHZ7GjDDmXZmVs')
    },
    getVersion: () => process.env.VUE_APP_VERSION,
  },
}
</script>
