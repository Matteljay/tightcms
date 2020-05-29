<template>
  <v-dialog overlay-opacity="0" max-width="290px"
    :value="display" @input="hideDialog()"
  >
    <v-card>
      <v-card-title>{{ vars.title }}</v-card-title>
      <v-card-text class="pb-0">
        <v-select label="Fill with"
          :value="getSettings[vars.type]"
          @input="setSetting({key: vars.type, val: $event})"
          :items="fillOptions"
        />
        <v-color-picker hide-mode-switch
          :value="getSettings[vars.color]"
          @input="setSetting({key: vars.color, val: $event})"
        />
        <v-text-field label="Path to image" clearable
          :value="path" @input="setPath($event)"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1" text
          @click="hideDialog()">Cancel</v-btn>
        <v-btn color="blue darken-1" text
          @click="saveDialog()">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapGetters, mapActions, mapMutations } from 'vuex'
export default {
  data() {
    return {
      fillOptions: [ 'Solid color', 'Scroll image repeat', 'Fixed image' ],
      resetValues: {},
      vars: {},
      display: false,
      path: '',
    }
  },
  computed: {
    ...mapGetters([ 'getSettings' ]),
  },
  methods: {
    ...mapActions([ 'commitSettings' ]),
    ...mapMutations([ 'setSetting' ]),
    setPath(value) {
      if(value) {
        this.path = value
      } else {
        this.path = ''
        this.setSetting({key: this.vars.type, val: 'Solid color'})
      }
    },
    saveDialog() {
      this.setSetting({key: this.vars.path, val: this.path})
      this.commitSettings()
      this.$emit('showSnack')
      this.display = false
    },
    hideDialog() {
      this.display = false
      this.setSetting({key: this.vars.type, val: this.resetValues.type})
      this.setSetting({key: this.vars.color, val: this.resetValues.color})
      this.setSetting({key: this.vars.path, val: this.resetValues.path})
    },
    show(vars) {
      this.resetValues = {
        type: this.getSettings[vars.type],
        color: this.getSettings[vars.color],
        path: this.getSettings[vars.path],
      }
      this.path = this.getSettings[vars.path]
      this.vars = { ...vars }
      this.display = true
    }
  },
}
</script>
