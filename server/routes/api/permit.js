const express = require('express')
const router = express.Router()
const mongodb = require('mongodb')
const sha512 = require('crypto-js/sha512')
const jsonWebToken = require('jsonwebtoken')

const jwtSecret = process.env.JWT_SECRET || 'tightsecret'
const jwtExpire = process.env.JWT_EXPIRE || '125h'
const pwSalt = process.env.USER_PW_SALT || 'tightsalt'
const hash = (name, pass) => sha512(name + pwSalt + pass).toString()

const connectDB = async () => {
    const login = (process.env.DB_USER && process.env.DB_PASS) ?
        `${process.env.DB_USER}:${process.env.DB_PASS}@` : ''
    const host = process.env.DB_HOST || 'localhost'
    const port = process.env.DB_PORT || 27017
    const name = process.env.DB_NAME || 'tightcms_content'
    try {
        const client = await mongodb.MongoClient.connect(
            `mongodb://${login}${host}:${port}/${name}`,
            { useUnifiedTopology: true, serverSelectionTimeoutMS: 5000 },
        )
        return client.db(name).collection('db')
    } catch(err) {
        console.log('Mongo Database connection failed: ' + err)
        console.log('Shutting down...')
        const waitFor = delay => new Promise(resolve => setTimeout(resolve, delay))
        await waitFor(5000)
        process.exit(0)
    }
}

const checkAccess = (req, res) => {
    if(!req || !req.headers || !req.headers.authorization) {
        return false
    }
    try {
        jsonWebToken.verify(req.headers.authorization, jwtSecret)
        return true
    } catch(err) {
        res.status(403).send('Login expired, please log in again')
        return false
    }
}

router.get('/', (req, res) => {
    if(checkAccess(req, res)) {
        res.status(201).send('Access granted')
    } else {
        res.status(403).send('Access denied')
    }
})

router.post('*', async (req, res) => {
    const oper = req.body
    if(oper.action === 'login') {
        const db = await connectDB()
        // verify incoming data
        if(!oper.email || !oper.password) {
            res.status(403).send('Empty fields not allowed')
            return
        }
        // look for specified user
        const existingUser = await db.findOne({ type: 'user', email: oper.email })
        if(existingUser.password !== hash(oper.email, oper.password)) {
            res.status(403).send('Access denied')
            return
        }
        const token = jsonWebToken.sign({data: oper.email}, jwtSecret, { expiresIn: jwtExpire})
        res.send({ username: existingUser.username, token })
    } else if(oper.action === 'changepw') {
        const db = await connectDB()
        // verify incoming data
        if(!oper.email || oper.email.length < 3 || !oper.newpw || oper.newpw.length < 6 || !oper.username) {
            res.status(403).send('Invalid change-password request')
            return
        }
        const existingUser = await db.findOne({ type: 'user' })
        // MULTI-USER: const existingUser = await db.findOne({ type: 'user', email: oper.email })
        if(existingUser) {
            // updating old user
            if(oper.oldpw && existingUser.password === hash(oper.email, oper.oldpw)) {
                // match existing user
                const newpw = hash(oper.email, oper.newpw)
                await db.updateOne({ type: 'user', email: oper.email }, {$set: {password: newpw}})
            } else {
                // bad old pw
                res.status(403).send('Invalid old password')
                return
            }
        } else {
            // create new user
            // MULTI-USER: check jwt to prevent unlimited new accounts
            const newpw = hash(oper.email, oper.newpw)
            await db.insertOne({ type: 'user', email: oper.email, username: oper.username, password: newpw })
        }
        const token = jsonWebToken.sign({data: oper.email}, jwtSecret, { expiresIn: jwtExpire})
        res.send({ token })
    }
})

module.exports = { router, checkAccess, connectDB }
