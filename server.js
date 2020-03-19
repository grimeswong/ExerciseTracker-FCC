const express = require('express')
const app = express()
const bodyParser = require('body-parser')
require('dotenv').config();
const shortid = require('shortid')
const moment = require('moment')

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
  username: {type: String, required: true},
  exercise: [{
    description: {type: String, required: true},
    duration: {type: Number, min: 0, required: true},
    date: {type: Date, required: true}
  }]
});

const USER = mongoose.model('USER', userScheme);

// Create a new user
app.post('/api/exercise/new-user', (req, res) => {
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

// Add exercises
app.post('/api/exercise/add', (req, res) => { //body -> userId, description, duration, date (all String)
  console.log(`id = ${JSON.stringify(req.body.userId)}`);
  USER.findOne({_id: req.body.userId}, (err, result) => {
    if(err!==null) {console.error(err)}
    if(result===null) { // couldn't find the user
      res.send("Invalid user ID");
    } else {
      console.log("Check data is valid or not");
      if(validateData(req.body.description, req.body.duration, req.body.date) === true) {
        USER.findOneAndUpdate({_id: req.body.userId},
          {$push:
            {exercise: {
              description: req.body.description,
              duration: parseInt(req.body.duration),
              date: req.body.date==="" ? new Date() : new Date(req.body.date) // if no date provided, use current date
            }}
          },
          {useFindAndModify: false, new: true},  //options
          (err, data)=> {
            if(err!==null) {console.error(err)}
            console.log("update a user exercise!!!")
            console.log(data);
            const recentAddExercise = data.exercise[data.exercise.length-1];
            res.json({  // response the last exercise added
              username: data.username,
              description: recentAddExercise.description,
              duration: recentAddExercise.duration,
              date: moment(recentAddExercise.date).format('ddd MMM DD YYYY'),
            })
          })
      } else {
        res.send("Invalid details, please enter the correct format!!!")
      }
    }
  })
});

// Get the user exercise logs
app.get('/api/exercise/log/', function(req, res) {
  console.log(`req.params = ${req.query.userId}`);
  USER.findOne({_id: req.query.userId}, (err, resultArr) => {
    if(err!==null) { console.error(err)
    } else {
      console.log(typeof(resultArr.exercise));
      res.json({
        _id: resultArr._id,
        username: resultArr.username,
        count: resultArr.exercise.length,
        log: resultArr.exercise.map((exercise)=>{
          return ({
            description: exercise.description,
            duration: exercise.duration,
            date: moment(exercise.date).format('ddd MMM DD YYYY'),
          })
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

// Functions
const validateData = (desc, dura, date) => {
  if(desc === "") {   // description must have some content
    console.log("desc will return false");
    return false
  }

  const numRegex = /^\d{1,}$/g   // duration has one digit at least
  if(!numRegex.test(dura)) {
    if(dura !=="") {
      console.log("duration will return false");
      return false
    }
  }
  const dateRegex = /[\d]{4}-[\d]{2}-[\d]{2}/g   // Must comply the format (yyyy-mm-dd)
  if(!dateRegex.test(date)){ // it can be nothing
    if(date !=="") {
      console.log("date will return false");
      return false
    }
  }
  console.log("will return true");
  return true;  // pass all the test
}
