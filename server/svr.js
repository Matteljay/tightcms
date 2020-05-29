const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const history = require('connect-history-api-fallback')
const app = express()

// Middleware
app.use(bodyParser.json())
app.use(cors())

// Link to routes
const permit = require('./routes/api/permit')
app.use('/api/permit', permit.router)
const content = require('./routes/api/content')
app.use('/api/content', content)
const files = require('./routes/api/files')
app.use('/api/filelist', files)
//const serveIndex = require('serve-index')
//app.use('/api/filelist', express.static(__dirname + '/'), serveIndex(__dirname + '/'))

app.use(express.static('public'))
app.get('*', function (req, res) {
  res.sendFile(__dirname + '/public/index.html')
})

// Finalize server
const port = process.env.EXPRESS_PORT || 5000
app.use(history())
app.listen(port, () => console.log(`TightCMS server started on port ${port}`))
