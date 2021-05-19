const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')
const multer  = require('multer');
const mongodb = require('mongodb')
const permit = require('./permit')
const pubPath = process.cwd() + '/public'
const uploadsPath = path.normalize(pubPath + '/uploads')

const mkdirForce = (inPath) => {
    if(fs.existsSync(inPath)) {
        const stats = fs.statSync(inPath)
        if(stats.isDirectory()) {
            return
        }
        fs.unlinkSync(inPath)
        mkdirForce(inPath) // recursive function
    }
    fs.mkdirSync(inPath, { recursive: true })
}
mkdirForce(uploadsPath)

const safePath = (inPath) => {
    let toFix = path.normalize(inPath)
    if(!toFix.startsWith(uploadsPath)) {
        toFix = uploadsPath
        //console.log('fixed path traversal attempt')
    }
    return toFix
}

const sendFolder = (res, inPath) => {
    const dir = fs.opendirSync(inPath)
    let entity
    let listing = []
    while((entity = dir.readSync()) !== null) {
        if(entity.isFile()) {
            listing.push({ type: 'f', name: entity.name })
        } else if(entity.isDirectory()) {
            listing.push({ type: 'd', name: entity.name })
        }
    }
    dir.closeSync()
    res.send(listing)
}

/*const sendFile = (res, inPath) => {
    //const newPath = pubPath + req.path + oper.name
    //const newPath = __dirname + '\\test.txt'
    const basename = path.basename(inPath);
    res.setHeader('Content-disposition', 'attachment; filename=' + basename)
    res.setHeader('Content-type', 'application/x-binary') //'text/plain'
    console.log('Download: ' + inPath)
    res.download(inPath)
}*/

router.get('*', (req, res) => {
    if(!permit.checkAccess(req, res))
        return
    const fullPath = safePath(pubPath + req.params[0])
    const stats = fs.statSync(fullPath)
    if(stats.isDirectory()) {
        sendFolder(res, fullPath)
    } else {
        res.status(404).send()
    }
})

router.post('*', async (req, res, next) => {
    if(!permit.checkAccess(req, res))
        return
    const oper = req.body
    const fullReqPath = (req.params && req.params[0]) ? pubPath + req.params[0] : ''
    if(oper.action === 'addFolder') {
        const newPath = safePath(fullReqPath + oper.name)
        mkdirForce(newPath)
        res.status(201).send()
    } else if(oper.action === 'editEntity') {
        const oldPath = safePath(fullReqPath + oper.oldName)
        const newPath = safePath(fullReqPath + oper.name)
        fs.renameSync(oldPath, newPath)
        res.status(201).send()
    } else if(oper.action === 'delFile') {
        const inPath = safePath(fullReqPath + oper.name)
        if(inPath.length > uploadsPath.length) {
            const stats = fs.statSync(inPath)
            if(stats.isFile()) {
                fs.unlinkSync(inPath)
            } else if(stats.isDirectory()) {
                fs.rmdirSync(inPath, { recursive: true })
            }
        }
        res.status(201).send()
    } else if(oper.action === 'downloadFile') {
        const inPath = safePath(fullReqPath + oper.name)
        res.download(inPath, undefined, { dotfiles: 'allow' })
    } else if(oper.action === 'genBackup') {
        //const date = new Date().toISOString().slice(0, 10).replace(/-/g, '') - date without time
        const date = new Date().toISOString().replace(/[-:\.]/g, '')
        const filename = date + '-' + 'MongoDB-TightCMS.json'
        mkdirForce(safePath(fullReqPath))
        const db = await permit.connectDB()
        const data = await db.find({type: {$ne: 'user'}}).toArray()
        fs.writeFileSync(safePath(fullReqPath + filename), JSON.stringify(data), {flags: 'x'})
        res.status(201).send()
    } else if(oper.action === 'syncBackup') {
        const data = fs.readFileSync(safePath(fullReqPath + oper.name), { encoding: 'utf8', flag: 'r' })
        const db = await permit.connectDB()
        const mongoData = JSON.parse(data).map( ({ _id, ...x }) => ({ _id: new mongodb.ObjectId(_id), ...x}))
        await db.deleteMany({type: {$ne: 'user'}})
        await db.insertMany(mongoData.filter(o => o.type !== 'user'))
        res.status(201).send()
    } else if(oper.action === 'wipeDB') {
        const db = await permit.connectDB()
        await db.deleteMany({})
        res.status(201).send()
    } else {
        next()
        // check for file upload below
    }
})

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, pubPath)
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname)
    }
})
const upload = multer({ storage: storage })

router.post('*', upload.any(), function(req, res) {
    if(!permit.checkAccess(req, res))
        return
    const files = req.files
    if (!files) {
      const error = new Error('Please choose files')
      error.httpStatusCode = 400
      return next(error)
    }
    res.send(files)
})

module.exports = router
