require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const expect = require('chai');
const helmet = require('helmet');

const cors = require('cors');

const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');
const Server = require('socket.io');

const app = express();

app.use(helmet({
  xPoweredBy: false,
  noCache: true,
}))
app.use((req,res,next) => {
  res.setHeader("X-Powered-By", 'PHP 7.4.3')
  next();
})
app.use('/public', express.static(process.cwd() + '/public'));
app.use('/assets', express.static(process.cwd() + '/assets'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//For FCC testing purposes and enables user to connect from outside the hosting platform
app.use(cors({origin: '*'})); 

// Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  }); 

//For FCC testing purposes
fccTestingRoutes(app);
    
// 404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

const portNum = process.env.PORT || 3000;

// Set up server and tests
let server = app.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch (error) {
        console.log('Tests are not valid:');
        console.error(error);
      }
    }, 1500);
  }
});

const io = new Server(server);
let players = [];
let idCount = 0,
collectibleCount = 0;
const CANVAS_BOUND_X = 600,
CANVAS_BOUND_Y = 380;
let collectibles = [];
setInterval(() => {
  if (collectibles.length == 0) {
    collectibleCount++
    let collectible = { 
      x: Math.floor(Math.random() * (CANVAS_BOUND_X+1)), 
      y: Math.floor(Math.random() * (CANVAS_BOUND_Y+1)), 
      value: Math.floor(Math.random() * (3))+1, id: collectibleCount, w: 10, h: 10 };
    collectibles.push(collectible)
    io.emit("collectible:spawn", collectible)
  }
}, 1000)
io.on('connection', (socket) => {
  idCount++;
  


  let pid = idCount;
  socket.on("disconnect", () => {

    players.splice(players.findIndex((i) => i.id == pid), 1);
    io.emit('player:leave', { id: pid })
  });
  socket.on("player:move", (data) => {

    let player = players.find((i) => i.id == data.id);
    if (player) {
      if (player.x + data.x >= CANVAS_BOUND_X || player.x + data.x <= 0) return;
      if (player.y + data.y >= CANVAS_BOUND_Y  || player.y + data.y <= 0) return;
      if (data.x) player.x += data.x
      if (data.y) player.y += data.y
    }

    io.emit('player:move', { x: player.x, y: player.y, id: data.id})
  })
  socket.on("player:collected", (data) => {

    let player = players.find((i) => i.id == data.id);
    let collectible = collectibles.find((i) => i.id == data.collectible);
    if (
      collectible &&
      player.x < collectible.x + collectible.w &&
      player.x + 32 > collectible.x &&
      player.y < collectible.y + collectible.h &&
      player.y + 32 > collectible.y
    ) {
      collectibles.splice(collectibles.findIndex((i) => i.id == data.collectible), 1)
      io.emit('collectible:collected', { id: player.id, collectible: data.collectible })
    }
   
  })

  players.push({ id: pid, score: 0, x: 100, y: 100 })
  io.emit('player:new', pid)
  socket.emit('connected', { you: pid, players, collectibles })
  return true;
})

module.exports = app; // For testing