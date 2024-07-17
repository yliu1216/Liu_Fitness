const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./Models/User.js');
const CookieParser = require('cookie-parser');
const axios = require('axios');
require('dotenv').config();


const bcrypSalt = bcrypt.genSaltSync(12);
const jwtSecret = process.env.JWT_SECRET;
const url = process.env.MONGO_URL;
const port = process.env.PORT || 4000;
// defining the Express app
const app = express();

// adding Helmet to enhance your Rest API's security
app.use(helmet());

// using bodyParser to parse JSON bodies into JS objects
app.use(bodyParser.json());

// adding morgan to log HTTP requests
app.use(morgan('combined'));

// defining an endpoint to return all ads

app.use(express.json());
app.use(CookieParser());
app.use(cors({
  credentials: true,
  origin: [
      'http://192.168.56.1:3000',
      'http://localhost:3000',
      'https://exercisedb.p.rapidapi.com',
      'http://localhost:3001',
      'https://liufitness.netlify.app',
      'https://liu-fitness.vercel.app'
  ],
  allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Credentials'],
}));

const exercise_url = process.env.EXERCISE_URL;
const bodypart_url = process.env.BODYPART_URL;

// requirement to access exercise api
 const exerciseOptions = {
  method: 'GET',
  url: exercise_url,
  params: {
    limit: '20',
    offset: '0'
  },
  headers: {
    'x-rapidapi-key': process.env.RAPID_API_KEY,
    'x-rapidapi-host': process.env.RAPID_API_HOST,
  }
 }
 
 /*
 {
    method: 'GET',
    url: exercise_url,
    headers: {
      'X-RapidAPI-Key': process.env.RAPID_API_KEY,
      'X-RapidAPI-Host': process.env.RAPID_API_HOST
    }
  };
*/

  const bodyPartOptions={
    method: 'GET',
    url: 'https://exercisedb.p.rapidapi.com/exercises/bodyPartList',
    headers: {
      'x-rapidapi-key': process.env.RAPID_API_KEY,
      'x-rapidapi-host':process.env.RAPID_API_HOST,
    }
  }
  
  /*
  {
    method:'GET',
    url:bodypart_url,
    headers:{
        'X-RapidAPI-Key': process.env.RAPID_API_KEY,
        'X-RapidAPI-Host': process.env.RAPID_API_HOST
    },
  }
 */

// get exercise data api
app.get('/exerciseData', async(req, res) => {
    try {
        const response = await axios.request(exerciseOptions);
        const responseData = response.data;
        res.json(responseData);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch exercise data" });
      }
})

//get exercise body part data api
app.get('/exerciseBodyPart', async(req, res)=>{
    try{
        const response =await axios.request(bodyPartOptions);
        res.json(response.data);
    }catch(err){
        console.error(err);
        res.status(500).json({ error: "Failed to fetch exercise data" });
    }
})

//get body part by name
app.get('/exerciseBodyPartName', async(req, res)=>{
    try{
        const { bodyPart } = req.query;
        console.log(bodyPart);
        const response = await axios.request({
            method: 'GET',
            url: `https://exercisedb.p.rapidapi.com/exercises/bodyPart/${bodyPart}`,
            headers: {
              'X-RapidAPI-Key': process.env.RAPID_API_KEY,
              'X-RapidAPI-Host': process.env.RAPID_API_HOST
            }
          });
        res.json(response.data);
    }catch(err){
        console.error(err);
        res.status(500).json({ error: "Failed to fetch exercise data" });
    }
})

//specific body part
app.get('/exercise/:id', async (req, res)=>{
    try{
        const{id}=req.params;
        const response = await axios.request({
            method: 'GET',
            url:   `https://exercisedb.p.rapidapi.com/exercises/exercise/${id}`,
            headers: {
              'X-RapidAPI-Key': process.env.RAPID_API_KEY,
              'X-RapidAPI-Host':  process.env.RAPID_API_HOST
            }})
            res.json(response.data);
    }catch(err){
        console.error(err);
        res.status(500).json({ error: "Failed to fetch exercise data" });
    }
})


//profile
app.get('/profile', function(req, res) {
    const { token } = req.cookies;
    console.log(token);
    if (!token) {
      return res.status(401).json('Token not found');
    }
  
    try {
      jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if (err) {
          console.log(err);
          return res.status(401).json('Invalid token');
        }
        res.json(userData);
      });
    } catch (err) {
      console.log(err);
      res.status(500).json('Server error');
    }
  });


//log out 
app.post('/logout', (req, res)=>{
    res.clearCookie('token', { domain: '192.168.56.1', path: "/", sameSite: 'none', secure: true });
    res.json({ message: 'Logged out successfully' });
});
  


//user register
app.post("/register", async(req, res) => {
  mongoose.connect(url).then(()=>(
      "connected to database for registration")).catch(err=>console.error(err));
  const {firstName, lastName, email, password} = req.body;
  try{
      const existingUser = await User.findOne({ email }).catch(err=>{console.log(err)});
      if(existingUser){
          console.log("Already registered");
          return res.status(400).json({ error: 'Email already exists' });
      }
      const userInfo = await User.create({
          firstname:firstName,
          lastname:lastName,
          email,
          password:bcrypt.hashSync(password, bcrypSalt)}).catch(err=>console.log(err));
      const token = await jwt.sign({userId:userInfo._id, email, firstname:userInfo._firstName, lastname:userInfo.lastName}, jwtSecret, {});
      res.cookie('token', token, {sameSite:'none', secure: true}).status(201).json({id:userInfo._id});
  }catch(err){
      console.error(err);
      res.status(500).json('error');
  }
})


//user login
app.post('/login', async (req, res) => {
  mongoose.connect(process.env.MONGO_URL).then(()=>{
  }).catch(err => console.log(err));
  const {email, password} = req.body;
  try{
      const userDoc = await User.findOne({email: email}).catch(err=>console.error(err));
      console.log(userDoc);
      if(userDoc){
          const validPass  = bcrypt.compareSync(password, userDoc.password);
          if(validPass){
                  await jwt.sign({userId: userDoc._id, email:userDoc.email, firstname:userDoc.firstname}, jwtSecret, {}, (err, token) => {
                  if(err) throw err;
                  res.cookie('token', token, {sameSite:"none", secure:true}).json(userDoc);
              });
          }else {
              res.status(422).json('password invalid');
          }
      }else {
          res.status(422).json('User cannot found');
      }
  }catch(err){
      console.log(err);
  }
})

// starting the server
app.listen(port, () => {
  console.log('listening on port 4000');
});