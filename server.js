const express = require('express')
const app = express()
const bodyParser = require('body-parser')
require('dotenv').config();
const shortid = require('shortid')

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

/* Database */
const userScheme = new mongoose.Schema({
  _id: {type: String, required: true},
  username: {type: String, required: true}
});

const USER = mongoose.model('USER', userScheme);

/* starting point */
app.route('/api/exercise/new-user').post((req, res) => {
  console.log(req.body.username);

  // todo: Check whether the username has been taken, if not save to database
  USER.findOne({username: req.body.username}, (err, result) => {
    if(err!==null) {console.error(err)};     // catch error

      if(result!==null) { // condition: the username was taken
        res.send('username was taken, please choose another one!!!')
      } else {
        // new username can be save to database
        let user = USER({
          _id: shortid.generate(),
          username: req.body.username
        })
        user.save((err, savedData) => {
          if(err!==null) {console.error(err)}
          console.log(savedData);
          res.json({
            username: savedData.username,
            _id: savedData._id
          })
        })
      }

  })

})

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

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
