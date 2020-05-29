const express = require('express')
const router = express.Router()
const mongodb = require('mongodb')
const permit = require('./permit')

/*const debug = async () => {
    console.log('Manual MongoDB operations')
    const db = await permit.connectDB()
    //await db.deleteMany({})
    //await db.deleteMany({ type: 'settings' })
    console.log(await db.find({}).toArray())
}
debug()*/

handleGroupOperation = async (oper) => {
    const db = await permit.connectDB()
    switch(oper.action) {
        case 'remove': //operator: action, _id
            if(!oper._id) {
                break
            }
            const subgroups = await db.find({ type: 'group', parId: oper._id }).toArray()
            for(let subgroup of subgroups) {
                await db.deleteMany({type: 'article', pageID: subgroup._id.toString()})
            }
            await db.deleteMany({type: 'group', parId: oper._id})
            await db.deleteOne({type: 'group', _id: new mongodb.ObjectId(oper._id)})
            await db.deleteMany({type: 'article', pageID: oper._id})
            break
        case 'add': //operator: action, parId, title
            let lastInGroup = await db.find({ type: 'group', parId: oper.parId })
                .sort({order: -1}).limit(1).toArray()
            let newOrder = lastInGroup.length > 0 ? lastInGroup[0].order + 1 : 0
            await db.insertOne({type: 'group', parId: oper.parId, title: oper.title, order: newOrder})
            break
        case 'edit': //operator: action, _id, newTitle
            await db.updateOne({type: 'group', _id: new mongodb.ObjectId(oper._id)},
                { $set: {title: oper.newTitle} })
            break
        case 'move': //operator: action, from_id, to_id, makeChild
            let target = await db.findOne({ type: 'group', _id: new mongodb.ObjectId(oper.to_id) })
            // don't allow moving into your own child
            if(target && oper.from_id === target.parId) break
            // don't allow moving into yourself
            if(oper.from_id === oper.to_id) break
            // if specified, assume group-append
            if(oper.makeChild) {
                // modify to append after target
                let lastInGroup = await db.find({ type: 'group', parId: oper.to_id })
                    .sort({order: -1}).limit(1).toArray()
                let newOrder = lastInGroup.length > 0 ? lastInGroup[0].order + 1 : 0
                await db.updateOne({type: 'group', _id: new mongodb.ObjectId(oper.from_id)},
                    { $set: {parId: oper.to_id, order: newOrder}})
                break
            }
            // make sure target exists
            if(!target) break
            // push all order-values of other groups
            await db.updateMany({ type: 'group', parId: target.parId, order: {$gte: target.order} }, 
                { $inc: {order: 1} })
            // modify source to fit in between
            await db.updateOne({type: 'group', _id: new mongodb.ObjectId(oper.from_id)},
                { $set: {parId: target.parId, order: target.order}})
            //{ $set: {title: oper.newTitle} })
            break
    }
    //groupTable = await db.find({ type: 'group' }).toArray()
    //console.log("JSON: " + JSON.stringify(groupTable))
}

handleArticleOperation = async (oper) => {
    const db = await permit.connectDB()
    switch(oper.action) {
        case 'addBottom':
            const lastInGroup = await db.find({ type: 'article', pageID: oper.pageID })
                .sort({order: -1}).limit(1).toArray()
            const newOrder = lastInGroup.length > 0 ? lastInGroup[0].order + 1 : 0
            oper.order = newOrder
            delete oper.action
            delete oper.editorID
            await db.insertOne(oper)
            // Set default setting
            await db.updateOne({type: 'settings'}, {$set: {previousInput: oper.format}}, {upsert: true})
            break
        case 'edit':
            await db.updateOne({type: 'article', _id: new mongodb.ObjectId(oper.editorID)},
                {$set: {title: oper.title, format: oper.format, body: oper.body}})
            break
        case 'move':
            // sanity checks & don't allow moving to yourself
            if(!oper.from_id || !oper.to_id || oper.from_id === oper.to_id) break
            // get target
            let target = await db.findOne({ type: 'article', _id: new mongodb.ObjectId(oper.to_id) })
            // make sure target exists
            if(!target) {
                //don't break yet: check to see if to_id is a (sub)pageId
                target = await db.findOne({ type: 'group', _id: new mongodb.ObjectId(oper.to_id) })
                // no valid target
                if(!target) break
                // got new parent
                target.pageID = target._id.toString()
                // get last article index in group
                const lastArticleInGroup = await db.find({ type: 'article', pageID: target.pageID })
                    .sort({order: -1}).limit(1).toArray()
                const newOrder = lastArticleInGroup.length > 0 ? lastArticleInGroup[0].order + 1 : 0
                // set to last-in-line
                target.order = newOrder
            } else {
                // push all order-values of other articles
                await db.updateMany({ type: 'article', pageID: target.pageID,
                    order: {$gte: target.order} }, { $inc: {order: 1} })
            }
            // modify source to fit in between
            await db.updateOne({type: 'article', _id: new mongodb.ObjectID(oper.from_id)},
                { $set: {order: target.order, pageID: target.pageID} })
            break
        case 'delete':
            await db.deleteOne({ _id: new mongodb.ObjectID(oper.id) })
            break
    }
    //console.log(await db.find({ type: 'article' }).toArray())
}

handleSettingsOperation = async (oper) => {
    const db = await permit.connectDB()
    switch(oper.action) {
        case 'put':
            delete oper.action
            await db.updateOne({type: 'settings'}, {$set: oper}, {upsert: true})
            break
    }
}

router.post('/', async (req, res) => {
    if(!permit.checkAccess(req, res))
        return
    const oper = req.body
    if(oper.type === 'group') {
        await handleGroupOperation(oper)
    } else if(oper.type === 'article') {
        await handleArticleOperation(oper)
    } else if(oper.type === 'settings') {
        await handleSettingsOperation(oper)
    }
    res.status(201).send()
})

/*router.delete('/:id', async (req, res) => {
    const db = await permit.connectDB()
    await db.deleteOne({
        _id: new mongodb.ObjectID(req.params.id)
    })
    res.status(200).send()
})*/

router.get('/', async (req, res) => { // from: fetchContentData
    const db = await permit.connectDB()
    const content = await db.find({ type: { $ne: 'user'}}).toArray()
    const count = await db.countDocuments({ type: 'user' })
    if(!count) {
        content.push({ type: 'needWelcome' })
    }
    res.send(content)
})

module.exports = router
