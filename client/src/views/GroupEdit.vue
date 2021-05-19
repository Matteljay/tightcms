<template>
  <div class="GroupEdit">
    <h1 class="mb-2">Group Editor</h1>
    <div class="blue lighten-1 px-3 py-1 ma-2"
      v-for="bookLine in getSubsWithAddBar()" :key="bookLine.page._id"
    >
      <GroupElement :page="bookLine.page" :showMoveDrop="showMoveDrop(bookLine.page)"
        @pressed-icon="pressedIcon($event, bookLine.page)"
      />
      <div class="grey lighten-1 px-3 py-1 ma-2"
        v-for="subBookLine in getSubsWithAddBar(bookLine)" :key="subBookLine.page._id"
      >
        <GroupElement :page="subBookLine.page" :showMoveDrop="showMoveDrop(subBookLine.page)"
          @pressed-icon="pressedIcon($event, subBookLine.page)"
        />
      </div>
    </div>
    <!-- Extra Dialogs -->
    <v-dialog v-model="delete_dialog.show" max-width="290">
      <v-card>
        <v-card-title>Delete</v-card-title>
        <v-card-text>
          Confirm removal of <b>{{ delete_dialog.title }}</b><br>
          All connected articles will be deleted as well!
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="delete_dialog.show = false">
            Cancel
          </v-btn>
          <v-btn color="blue darken-1" text @click="deleteAt()">
            Ok
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="add_dialog.show" max-width="290">
      <v-card>
        <v-card-title>Add Group</v-card-title>
        <v-card-text>
          <v-text-field v-on:keyup.enter="addAt" label="Title for new group"
            v-model="add_dialog.title" clearable autofocus />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="add_dialog.show = false">
            Cancel
          </v-btn>
          <v-btn color="blue darken-1" text @click="addAt()">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="edit_dialog.show" max-width="290">
      <v-card>
        <v-card-title>Edit Group</v-card-title>
        <v-card-text>
          <v-text-field @keyup.enter="editAt" label="Edit group title"
            v-model="edit_dialog.newTitle" clearable autofocus />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="edit_dialog.show = false">
            Cancel
          </v-btn>
          <v-btn color="blue darken-1" text @click="editAt()">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import GroupElement from '@/components/GroupElement.vue'
let prevMoverParent = 'none'
export default {
  components: {
    GroupElement,
  },
  data() {
    return {
      delete_dialog: { show: false },
      add_dialog: { show: false },
      edit_dialog: { show: false },
      move_selected: { active: false },
    }
  },
  computed: {
    ...mapGetters(['getSubsForURL']),
  },
  methods: {
    ...mapActions(['postGroupOperation']),
    getSubsWithAddBar(bookLine) {
      if(bookLine && bookLine.page.isAddBar) return [] // don't nest inside addBar
      const ret = this.getSubsForURL(bookLine ? bookLine.url : null)
      const parId = bookLine ? bookLine.page._id : null
      ret.push({url: null, page: {_id: parId, type: 'group', parId, title: "Add new...", order: 0, isAddBar: true}})
      return ret
    },
    deleteAt() {
      if(!this.delete_dialog.show) return // fix for catching event during hide-transition
      this.delete_dialog.show = false
      this.postGroupOperation({ action: 'remove', _id: this.delete_dialog._id })
    },
    addAt() {
      if(!this.add_dialog.show) return // fix for catching event during hide-transition
      this.add_dialog.show = false
      const title = this.add_dialog.title ? this.add_dialog.title.trim() : ''
      if(title.length < 1) {
        return
      }
      this.postGroupOperation({ action: 'add', parId: this.add_dialog.parId, title: title })
    },
    editAt() {
      if(!this.edit_dialog.show) return // fix for catching event during hide-transition
      this.edit_dialog.show = false
      const newTitle = this.edit_dialog.newTitle ? this.edit_dialog.newTitle.trim() : ''
      if(newTitle.length < 1 || this.edit_dialog.title == this.edit_dialog.newTitle) {
        return
      }
      this.postGroupOperation({ action: 'edit', _id: this.edit_dialog._id, newTitle: newTitle })
    },
    moveAt() {
      this.move_selected.active = false
      this.postGroupOperation({ action: 'move',
        from_id: this.move_selected._id,
        to_id: this.move_selected.target_id,
        makeChild: this.move_selected.makeChild })
    },
    showMoveDrop(thisElement) {
      if(!this.move_selected.active) {
        return 'mover'
      }
      const isParentSelected = (this.move_selected.parId === null)
      // if a page was selected and you're any subpage -- ALLOW hiding
      /*if(this.move_selected.parId === null && thisElement.parId !== null) { 
        return 'mover'
      }*/
      // if a parent was selected and you're its sub
      if(isParentSelected && thisElement.parId === this.move_selected._id) { 
        return 'mover'
      }
      // allow self-cancel
      if(thisElement._id === this.move_selected._id) {
        // also disable/grey-out the next item, must be non-reactive variable to avoid an infinite loop
        prevMoverParent = this.move_selected.parId
        return 'mover'
      }
      // disable useless move target
      if(prevMoverParent === thisElement.parId) {
        prevMoverParent = 'none'
        return 'dropper_grey'
      }
      return 'dropper'
    },
    pressedIcon(type, pageElement) {
      switch(type) {
        case 'remove':
          this.delete_dialog._id = pageElement._id
          this.delete_dialog.title = pageElement.title
          this.delete_dialog.show = true
          break
        case 'add':
          this.add_dialog.parId = pageElement._id
          this.add_dialog.title = ''
          this.add_dialog.show = true
          break
        case 'edit':
          this.edit_dialog._id = pageElement._id
          this.edit_dialog.title = pageElement.title
          this.edit_dialog.newTitle = pageElement.title
          this.edit_dialog.show = true
          break
        case 'moveFrom':
          if(this.move_selected.active && this.move_selected._id === pageElement._id) {
            this.move_selected.active = false
          } else {
            this.move_selected.active = true
            this.move_selected._id = pageElement._id
            this.move_selected.parId = pageElement.parId
          }
          this.$forceUpdate() // re-render this component
          break
        case 'moveTo':
          this.move_selected.target_id = pageElement._id
          this.move_selected.makeChild = pageElement.isAddBar
          this.move_selected.active = false
          this.moveAt()
          break
      }
    },
  },
}
</script>
