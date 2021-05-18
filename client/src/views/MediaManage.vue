<template>
  <div class="MediaManage">
    <h1>Manage your Media</h1>
    <!-- current folder + go up + go home -->
    <v-container pl-6 py-0>
      <v-row class="align-center">
        <v-col class="text-truncate">Current folder: <strong>{{ getCurrentFolder }}</strong></v-col>
        <v-col class="shrink text-no-wrap" justify="right" align="end">
          <v-btn text icon class="my-1" @click="pushDirUp()"><v-icon>fa-level-up-alt</v-icon></v-btn>
          <v-btn text icon class="my-1" @click="pushDirHome()"><v-icon>fa-home</v-icon></v-btn>
        </v-col>
      </v-row>
    </v-container>
    <!-- buttons: add file(s), create folder { primary, secondary, success, info, warning, error } -->
    <v-container px-6 py-0>
      <v-row class="align-center">
        <input type="file" multiple ref="file" style="display: none" @change="addFiles()">
        <v-col align="center"><v-btn class="success" @click="$refs.file.click()">Add file(s)</v-btn></v-col>
        <v-col align="center"><v-btn class="primary" @click="addFolder_dialog.show = true">Create folder</v-btn></v-col>
        <v-col align="center"><v-btn class="error"
          @click.exact="generateBackup()" @click.alt.exact="wipeDB_dialog.show = true">DB backup</v-btn></v-col>
      </v-row>
    </v-container>
    <!-- folder list + file list +++ rename + delete + [goto/copy link] + Download -->
    <v-container>
    <v-row class="align-center grey lighten-1 pl-4 my-1" v-for="dir in getFileList.filter(v => v.type === 'd')" :key="dir.name">
      <v-col><v-btn small @click="pushDir(dir.name)">{{ dir.name }}</v-btn></v-col>
      <v-col class="shrink text-no-wrap" justify="right" align="end">
        <v-btn text icon small @click="showEditDialog(dir.name)"><v-icon small>fa-edit</v-icon></v-btn>
        <v-btn text icon small @click="showRemoveDialog(dir.name)"><v-icon small>fa-trash-alt</v-icon></v-btn>
      </v-col>
    </v-row>
    <v-row class="align-center grey lighten-1 pl-4 my-1" v-for="file in getFileList.filter(v => v.type === 'f')" :key="file.name">
      <v-col class="text-truncate"><v-btn text small @click.stop="fileClick(file.name)">{{ file.name }}</v-btn></v-col>
      <v-col class="shrink text-no-wrap" justify="right" align="end">
        <!-- <v-btn text icon small @click="upload(file.name)"
          v-if="file.name.endsWith('MongoDB-TightCMS.json')"><v-icon small>fa-wrench</v-icon></v-btn> -->
        <v-btn text icon small @click="download(file.name)"><v-icon small>fa-download</v-icon></v-btn>
        <v-btn text icon small @click="showEditDialog(file.name)"><v-icon small>fa-edit</v-icon></v-btn>
        <v-btn text icon small @click="showRemoveDialog(file.name)"><v-icon small>fa-trash-alt</v-icon></v-btn>
      </v-col>
    </v-row>
    </v-container>
    <!-- Dialogs -->
    <v-snackbar :timeout=1500 v-model="snackbar_copied" color="success" right top>
      Link copied to clipboard
      <v-btn dark text @click="snackbar_copied = false">Close</v-btn>
    </v-snackbar>
    <v-snackbar :timeout=1500 v-model="snackbar_genbackup" color="secondary" right top>
      Writing to {{ backupsFolder }}
      <v-btn dark text @click="snackbar_genbackup = false">Close</v-btn>
    </v-snackbar>
    <v-snackbar :timeout=1500 v-model="snackbar_uploadbackup" color="info" right top>
      Restoring backup
      <v-btn dark text @click="snackbar_uploadbackup = false">Close</v-btn>
    </v-snackbar>
    <v-dialog v-model="addFolder_dialog.show" max-width="290">
      <v-card>
        <v-card-title>Add Folder</v-card-title>
        <v-card-text>
          <v-text-field @keyup.enter="createFolder()" label="Title for new folder"
            v-model="addFolder_dialog.title" clearable autofocus />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="addFolder_dialog.show = false">Cancel</v-btn>
          <v-btn color="blue darken-1" text @click="createFolder()">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="editEntity_dialog.show" max-width="290">
      <v-card>
        <v-card-title>Rename Folder</v-card-title>
        <v-card-text>
          <v-text-field @keyup.enter="renameEntity()" label="New name"
            v-model="editEntity_dialog.title" clearable autofocus />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="editEntity_dialog.show = false">Cancel</v-btn>
          <v-btn color="blue darken-1" text @click="renameEntity()">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="delEntity_dialog.show" max-width="290">
      <v-card>
        <v-card-title>Delete Entity</v-card-title>
        <v-card-text>
          Do you want to remove <strong>{{ delEntity_dialog.title }}</strong>?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="delEntity_dialog.show = false">Cancel</v-btn>
          <v-btn color="blue darken-1" text @click="removeEntity()">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="restoreBU_dialog.show" max-width="290">
      <v-card>
        <v-card-title>Restore Backup</v-card-title>
        <v-card-text>
          Do you want to <strong>OVERWRITE</strong> all current settings with {{ restoreBU_dialog.filename }}?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="restoreBU_dialog.show = false">Cancel</v-btn>
          <v-btn color="blue darken-1" text @click="restoreBackup()">Restore</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="wipeDB_dialog.show" max-width="290">
      <v-card>
        <v-card-title>Wipe Database</v-card-title>
        <v-card-text>
          <strong>Do you want to WIPE the entire TightCMS database??</strong>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="wipeDB_dialog.show = false">Cancel</v-btn>
          <v-btn color="blue darken-1" text @click="wipeDB()">DELETE</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="getIsUploading" persistent max-width="290">
      <v-card>
        <v-card-title>Uploading...</v-card-title>
        <v-card-text>
          <div class="text-center">
            <v-progress-circular indeterminate color="green"></v-progress-circular>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { mapGetters, mapActions, mapMutations } from 'vuex'
const homeDir = '/uploads/'
export default {
  data() {
    return {
      homeFolder: homeDir,
      backupsFolder: homeDir + 'backups/',
      snackbar_copied: false,
      snackbar_genbackup: false,
      snackbar_uploadbackup: false,
      addFolder_dialog: { show: false },
      editEntity_dialog: { show: false },
      delEntity_dialog: { show: false },
      restoreBU_dialog: { show: false },
      wipeDB_dialog: { show: false },
    }
  },
  computed: {
    ...mapGetters(['getFileList', 'getIsUploading', 'getCurrentFolder']),
  },
  methods: {
    ...mapActions(['fetchFileList', 'addFolder', 'editEntity', 'delFile',
      'downloadFile', 'pushFiles', 'genBackup', 'uploadBackup', 'wipeDB']),
    ...mapMutations(['setCurrentFolder']),
    pushDirHome() {
      this.setCurrentFolder(this.homeFolder)
      this.fetchFileList(this.getCurrentFolder)
    },
    pushDirUp() {
      if(this.getCurrentFolder === '/uploads/') {
        return
      }
      const newPath = this.getCurrentFolder.split('/').slice(0, -2).join('/') + '/'
      this.setCurrentFolder(newPath)
      this.fetchFileList(this.getCurrentFolder)
    },
    pushDir(path) {
      this.setCurrentFolder(this.getCurrentFolder + path + '/')
      this.fetchFileList(this.getCurrentFolder)
    },
    fileClick(name) { // catches backup click or copy to clipboard
      if(name.endsWith('MongoDB-TightCMS.json')) {
        this.restoreBU_dialog.filename = name
        this.restoreBU_dialog.show = true
      } else {
        this.$copyText(this.getCurrentFolder + name)
        this.snackbar_copied = true
      }
    },
    createFolder() {
      if(!this.addFolder_dialog.title) {
        return
      }
      this.addFolder({ name: this.addFolder_dialog.title, path: this.getCurrentFolder })
      this.addFolder_dialog = { show: false }
    },
    showEditDialog(name) {
      this.editEntity_dialog.oldTitle = name
      this.editEntity_dialog.title = name
      this.editEntity_dialog.show = true
    },
    renameEntity() {
      if(!this.editEntity_dialog.title || this.editEntity_dialog.oldTitle === this.editEntity_dialog.title) {
        return
      }
      this.editEntity({ oldName: this.editEntity_dialog.oldTitle, name: this.editEntity_dialog.title, path: this.getCurrentFolder })
      this.editEntity_dialog = { show: false }
    },
    showRemoveDialog(name) {
      this.delEntity_dialog.title = name
      this.delEntity_dialog.show = true
    },
    removeEntity() {
      this.delFile({ name: this.delEntity_dialog.title, path: this.getCurrentFolder })
      this.delEntity_dialog = { show: false }
    },
    download(name) {
      this.downloadFile({ name, path: this.getCurrentFolder })
    },
    addFiles() {
      const files = this.$refs.file.files
      if(files.length <= 0) {
        return
      }
      this.$refs.file.value = null // fix: allow upload of same file multiple times in some browsers
      this.pushFiles({ files, path: this.getCurrentFolder })
    },
    generateBackup() {
      this.setCurrentFolder(this.backupsFolder)
      this.genBackup({ path: this.backupsFolder })
      this.snackbar_genbackup = true
    },
    restoreBackup() {
      this.uploadBackup({ name: this.restoreBU_dialog.filename, path: this.getCurrentFolder })
      this.restoreBU_dialog = { show: false }
    },
  },
  async created() {
    if(!this.getCurrentFolder) {
      this.setCurrentFolder(this.homeFolder)
      await this.fetchFileList(this.getCurrentFolder)
    }
  },
}
</script>

<style lang="scss" scoped>
  * {
    // v-btn uncapitalize letters
    text-transform: none !important;
  }
</style>
