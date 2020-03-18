const express = require('express')
const app = express()
const bodyParser = require('body-parser')
require('dotenv').config();

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.Promise = global.Promise;
const connectDB = mongoose.connect(process.env.DB_URI, {useNewUrlParser: true, useUnifiedTopology: true})
  .then(()=> {
    console.log("Database is connected successfully!");
  })
  .catch(error => console.error(`Cannot connect to the database due to ${error}`));


app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

app.post('/api/exercise/new-user', (req, res) => {
  console.log(req.body.username);
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
