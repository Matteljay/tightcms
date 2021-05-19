import axios from 'axios'

const state = {
    files: [''],
    isUploading: false,
    currentFolder: '',
}

const getters = {
    getFileList: state => state.files,
    getIsUploading: state => state.isUploading,
    getCurrentFolder: state => state.currentFolder,
}

const mutations = {
    setFileList: (state, files) => state.files = files,
    setIsUploading: (state, status) => state.isUploading = status,
    setCurrentFolder: (state, folder) => state.currentFolder = folder,
}

const actions = {
    async fetchFileList({ commit }, payload) {
        try {
            const response = await axios.get('/api/filelist' + payload)
            commit('setFileList', response.data)
        } catch(err) {
            commit('setError', err)
        }
    },
    async addFolder({ dispatch, commit }, payload) {
        try {
            payload.action = 'addFolder'
            await axios.post(`/api/filelist${payload.path}`, payload)
            await dispatch('fetchFileList', payload.path)
        } catch(err) {
            commit('setError', err)
        }
    },
    async editEntity({ dispatch, commit }, payload) {
        try {
            payload.action = 'editEntity'
            await axios.post(`/api/filelist${payload.path}`, payload)
            await dispatch('fetchFileList', payload.path)
        } catch(err) {
            commit('setError', err)
        }
    },
    async delFile({ dispatch, commit }, payload) {
        try {
            payload.action = 'delFile'
            await axios.post(`/api/filelist${payload.path}`, payload)
            await dispatch('fetchFileList', payload.path)
        } catch(err) {
            commit('setError', err)
        }
    },
    async downloadFile({ commit }, payload) {
        let response
        try {
            payload.action = 'downloadFile'
            response = await axios.post(`/api/filelist${payload.path}`, payload, { responseType: 'blob' })
        } catch(err) {
            commit('setError', err)
            return
        }
        const link = document.createElement('a')
        link.href = window.URL.createObjectURL(new Blob([response.data], { type: 'application/x-binary' }))
        link.setAttribute('download', payload.name) //response.headers['content-disposition'].split('filename=')[1]
        document.body.appendChild(link)
        link.click()
        link.remove()
    },
    async pushFiles({ commit, dispatch }, payload) {
        try {
            commit('setIsUploading', true)
            //payload.action = 'pushFiles' - implicit
            let formData = new FormData()
            for(const file of payload.files) {
                // slightly hacky, multer cannot read formData.append('user', '/path')
                formData.append(payload.path + file.name, file)
            }
            //for(let i = 0; i < payload.files.length; i++)
            //    formData.append('files[' + i + ']', payload.files[i], payload.files[i].name)
            await axios.post(`/api/filelist${payload.path}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
            await dispatch('fetchFileList', payload.path)
            commit('setIsUploading', false)
        } catch(err) {
            commit('setError', err)
        }
    },
    async genBackup({ commit, dispatch }, payload) {
        try {
            payload.action = 'genBackup'
            await axios.post(`/api/filelist${payload.path}`, payload)
            await dispatch('fetchFileList', payload.path)
        } catch(err) {
            commit('setError', err)
        }
    },
    async uploadBackup({ commit, dispatch }, payload) {
        try {
            payload.action = 'syncBackup'
            await axios.post(`/api/filelist${payload.path}`, payload)
            await dispatch('fetchContentData')
        } catch(err) {
            commit('setError', err)
        }
    },
    async wipeDB({ commit, dispatch }) {
        try {
            await axios.post('/api/filelist', { action: 'wipeDB' })
            await dispatch('perLogout')
            location.reload()
        } catch(err) {
            commit('setError', err)
        }
    },
}

export default {
    state,
    getters,
    mutations,
    actions
}
