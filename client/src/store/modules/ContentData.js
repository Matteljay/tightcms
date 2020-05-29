import axios from 'axios'

const state = {
    doneLoading: false,
    needWelcome: true,
    orderedURLbook: [],
    currentBookLine: {},
    articles: [ {_id: "0", type: "article", title: "Example title",
        body: "This is example text", format: "plaintext", pageID: "0", createdAt: "0"} ],
    error: '',
    defaultSettings: { faviconPath: '', pageTitle: 'MyWebsite', urlText: '',
        menuColor: '#267676', pageWidth: '960px',
        fontFamily: 'Arial', fontSize: '16px', listImage: '', dateDisplay: 'yyyy-mm-dd',
        bgType: 'Solid color', bgColor: '#C1BCB5', bgPath: '',
        fgType: 'Solid color', fgColor: '#CBD8DE', fgPath: '',
        footerColor: '#8E8456', footerText: '2020 - powered by TightCMS',
        previousInput: 'HTML' },
    settings: {},
    // empty key names required for computed
    calcSettings: { bgColor_font: '', fgColor_font: '', menuColor_font: '', footerColor_font: '' },
    editArticle: { title: '', format: '', body: '', editorID: '' },
    moveArticle: '',
}
state.settings = { ...state.defaultSettings }

const getters = {
    getDoneLoading: state => state.doneLoading,
    getNeedWelcome: state => state.needWelcome,
    getOrderedURLbook: state => state.orderedURLbook,
    getCurrentBookLine: state => state.currentBookLine,
    getSubsForURL: state => (url) => url ?
        state.orderedURLbook.filter(o => o.url.startsWith(url + '/')) :
        state.orderedURLbook.filter(o => o.url.indexOf('/', 1) === -1),
    getArticles: state => (pageID) =>
        state.articles.filter(v => v.pageID === pageID).sort((a, b) => b.order - a.order),
    getError: state => state.error,
    getSettings: state => state.settings,
    getCalcSettings: state => state.calcSettings,
    getEditArticle: state => state.editArticle,
    getMoveArticle: state => state.moveArticle,
}

const contrastColor = (c) => { // helper for mutations
    const color = (c.charAt(0) === '#') ? c.substring(1, 7) : c
    const r = parseInt(color.substring(0, 2), 16)
    const g = parseInt(color.substring(2, 4), 16)
    const b = parseInt(color.substring(4, 6), 16)
    return (((r * 0.299) + (g * 0.587) + (b * 0.114)) > 186) ? 'black' : 'white'
}

const mutations = {
    setDoneLoading: (state, val) => state.doneLoading = val,
    setNeedWelcome: (state, args) => state.needWelcome = args,
    setOrderedURLbook: (state, args) => state.orderedURLbook = args,
    setCurrentBookLine: (state, args) => state.currentBookLine = args,
    setArticles: (state, articles) => state.articles = articles,
    setError: (state, err) => state.error =
        (err.response && err.response.data) ? err.response.data : err,
    setSetting: (state, {key, val}) => {
        //console.log(`STORE key: ${key} val: ${val}`)
        state.settings[key] = val
        if(/Color$/.test(key)) {
            const kfont = key + '_font'
            const vfont = contrastColor(val)
            state.calcSettings[kfont] = vfont
        }
    },
    setAllSettings: (state, args) => {
        for(let key in state.settings) {
            const val = args[key]
            if(val)
                mutations.setSetting(state, {key, val})
        }
        // get previous default format/HTML setting, do this only once per app load
        if(!state.editArticle.format) {
            state.editArticle.format = args.previousInput
        }        
    },
    setEditArticle: (state, args) => state.editArticle[args.key] = args.val,
    setMoveArticle: (state, args) => state.moveArticle = args,
}

const toBars = (title) => {
    const ret = title.replace(/[^\s\w-]/g, '')
    return ret.replace(/\s+/g, '-').toLowerCase()
}

const orderedURLbookFromGroups = (groups) => {
    let ret = []
    const pages = groups.filter(v => v.parId === null)
        .sort((a, b) => a.order - b.order)
    for(let page of pages) {
        const encPage = toBars(page.title)
        ret.push({url: '/' + encPage, page})
        for(let subpage of groups.filter(v => v.parId === page._id)
            .sort((a, b) => a.order - b.order)) {
            ret.push({url: '/' + encPage + '/' + toBars(subpage.title), page: subpage})
        }
    }
    return ret
}

const actions = {
    async fetchContentData({ commit }) {
        let response
        try {
            response = await axios.get('/api/content/')
        } catch(err) {
            commit('setError', err)
            return
        }
        const groups = [], articles = []
        let newSets = { ...state.defaultSettings } // shallow object clone
        let needWelcome = false
        for(const elem of response.data) {
            switch(elem.type) {
                case 'group':
                    groups.push(elem)
                    break
                case 'article':
                    articles.push(elem)
                    break
                case 'settings':
                    newSets = elem
                    break
                case 'needWelcome':
                    needWelcome = true
                    break
            }
        }
        commit('setAllSettings', newSets)
        commit('setNeedWelcome', needWelcome)
        commit('setArticles', articles)
        commit('setOrderedURLbook', orderedURLbookFromGroups(groups))
        commit('setDoneLoading', true)
    },
    async addArticle({ dispatch, commit }, payload) {
        try {
            payload.type = 'article'
            payload.action = 'addBottom'
            await axios.post('/api/content/', payload)
            await dispatch('fetchContentData')
        } catch(err) {
            commit('setError', err)
        }
    },
    async editArticle({ dispatch, commit }, payload) {
        try {
            payload.type = 'article'
            payload.action = 'edit'
            await axios.post('/api/content/', payload)
            await dispatch('fetchContentData')
        } catch(err) {
            commit('setError', err)
        }
    },
    async moveArticle({ dispatch, commit }, payload) {
        try {
            payload.type = 'article'
            payload.action = 'move'
            await axios.post('/api/content/', payload)
            await dispatch('fetchContentData')
        } catch(err) {
            commit('setError', err)
        }
    },
    async deleteArticle({ dispatch, commit }, payload) {
        try {
            payload.type = 'article'
            payload.action = 'delete'
            await axios.post('/api/content/', payload)
            await dispatch('fetchContentData')
        } catch(err) {
            commit('setError', err)
        }
    },
    async commitSettings({ commit }) {
        try {
            const payload = state.settings
            payload.type = 'settings'
            payload.action = 'put'
            await axios.post('/api/content/', payload)
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
