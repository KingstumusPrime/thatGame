// load dependencies

var express = require("express");
var http = require("http");
var path = require("path");
var socketIO = require("socket.io");

// set port
var port = 8080;

// init framework

var players = {};

var gold = {
  "someG": {
    "x": 2117.99,
    "y": 1151.99,
    "w": 16,
    "h": 16,
    type: 1.13,
  },
  "g1": {
    "x": 50,
    "y": 1039.99,
    "w": 16,
    "h": 16,
    type: Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01,
  },
  "g2": {
    "x": 1029,
    "y": 1039,
    "w": 16,
    "h": 16,
    type: Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01,
  },
  "g3": {
    "x": 1899,
    "y": 943,
    "w": 16,
    "h": 16,
    type: Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01,
  },
  "g4": {
    "x": 2528,
    "y": 1072,
    "w": 16,
    "h": 16,
    type: Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01,
  },
  "g5": {
    "x": 2949,
    "y": 1072,
    "w": 16,
    "h": 16,
    type: Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01,
  },
  "g6":  {x: 192.01, y: 1519.99, w: 16, h: 16, type: Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01},
  "g7": {x: 688.99, y: 1519.99, w: 16, h: 16, type: Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01},
  "g8": {x: 1481.99, y: 1551.99, w: 16, h: 16, type: Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01},
  "g9": {x: 2405.99, y: 1519.99, w: 16, h: 16, type: Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01},
  "g10": {x: 2816.01, y: 1519.99, w: 16, h: 16, type: Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01},
  "g11": {x: 3825.99, y: 1487.99, w: 16, h: 16, type: Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01},
  "g12": {x: 3994.99, y: 1487.99, w: 16, h: 16, type: Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01},
  "g13": {x: 4189.99, y: 1487.99, w: 16, h: 16, type: Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01},
  "g14": {x: 4189.99, y: 1397.99, w: 16, h: 16, type: Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01},
  "g15": {x: 4189.99, y: 1307.99, w: 16, h: 16, type: Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01},
  "g16": {x: 4645.99, y: 1455.99, w: 16, h: 16, type: Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01},
  "g17": {x: 3520.01, y: 975.99, w: 16, h: 16, type: Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01},
  "g18": {x: 3570.01, y: 975.99, w: 16, h: 16, type: Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01},
  'g19': {x: 3610.01, y: 975.99, w: 16, h: 16, type: Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01},
  "g20": {x: 5221.99, y: 975.99, w: 16, h: 16, type: Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01},
  "g21": {x: 4768.01, y: 975.99, w: 16, h: 16, type: Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01},
  "g22": {x: 5195.99, y: 719.99, w: 16, h: 16, type: Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01},
  "g23": {x: 4421.01, y: 879.99, w: 16, h: 16, type: Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01},
  "g24": {x: 3675.01, y: 783.99, w: 16, h: 16, type: Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01},
  "g25": {x: 3520.01, y: 783.99, w: 16, h: 16, type: Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01},
  "g26": {x: 3520.01, y: 527.99, w: 16, h: 16, type: Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01},
  "g27": {x: 3675.01, y: 527.99, w: 16, h: 16, type: Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01},
  "g28": {x: 4000.01, y: 751.99, w: 16, h: 16, type: Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01},
  "g29": {x: 3968.01, y: 559.99, w: 16, h: 16, type: Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01},  
  "g30": {x: 3571.01, y: 783.99, w: 16, h: 16, type: Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01},
  "g31": {x: 3520.01, y: 239.99, w: 16, h: 16, type: Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01},
  "g32": {x: 3520.01, y: 399.99, w: 16, h: 16, type: Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01},
  "g33": {x: 4367.99, y: 207.99, w: 16, h: 16, type: Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01},
  "g34": {x: 4549.99, y: 207.99, w: 16, h: 16, type: Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01},
  "g35": {x: 4770.99, y: 207.99, w: 16, h: 16, type: Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01},
  "g36": {x: 5211.99, y: 367.99, w: 16, h: 16, type: Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01},
  "g37": {x: 5221.99, y: 207.99, w: 16, h: 16, type: Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01},
  "g38": {x: 4906.99, y: 495.99, w: 16, h: 16, type: Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01},
  "g39": {x: 5221.99, y: 527.99, w: 16, h: 16, type: Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01},
};

// instancing

var app = express(); 



var server = http.createServer(app); // start se




var io = socketIO(server); // pass the server so

app.set("port", port) // set server port

//used ‘public’ folder to use external CSS and JS
app.use("/public", express.static(__dirname + "/public"));

server.listen(port, function() {
    console.log("listening...");
})

// handle requests and responses with express
app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, "/public/landing.html"));
})

io.on("connection", function(socket) {
  //returns socket which is a pice of data that talks to server and client
  console.log("Someone has connected");
  players[socket.id] = {
    player_id: socket.id,
    x: 50,
    y: 450,
    width: 90,
    height: 120,
    color: "black",
    anim: 0,
    frame: 0, 
    flipped: -1,
    health: 40,
    maxHealth: 40,
    gold: 0,
    img: "bandit",
    };

  socket.emit("actualPlayers", {"p": players, "uid": socket.id, "gold": gold}); //sends info back to that socket and not to all the other sockets
  socket.broadcast.emit("new_player", players[socket.id]);

  socket.on("player_moved", function(movement_data) {
    movement_data.id = socket.id;
    socket.broadcast.emit("player_moved", movement_data);

    players[socket.id].x += movement_data.x;
    players[socket.id].y += movement_data.y;
  })

  socket.on("setPos" , function(movement_data) {
    movement_data.id = socket.id;
    io.emit("setPos", movement_data);

    players[socket.id].x = movement_data.x;
    players[socket.id].y = movement_data.y;
  })

  socket.on("changeAnim" , function(animData) {
    animData.id = socket.id;
    io.emit("changeAnim", animData);

    players[socket.id].color = animData.color;
    players[socket.id].anim = animData.anim;
    players[socket.id].frame = animData.frame;
    players[socket.id].flipped = animData.flipped;
  })


socket.on("setImg", function(data) {
  io.emit("setImg", data);
  players[data.id].img = data.img;
})

  socket.on("damagePlayer" , function(HurtData) {
    io.emit("damagePlayer", HurtData);

    players[HurtData.id].health -= HurtData.health;
    if(players[HurtData.id].health < 0){
      players[HurtData.id].health = 0;
    }
  })

  socket.on("addGold", function(goldData){
    io.emit("addGold", goldData);
    gold[goldData.id] = goldData.gold;
  })

  socket.on("new_bullet", function(bullet_data){
    socket.broadcast.emit("new_bullet", bullet_data);
  })

  socket.on("resetPlayer", function(pid) {
    io.emit("resetPlayer", {id: pid, player:  {
      player_id: pid,
      x: 50,
      y: 450,
      width: 90,
      height: 120,
      color: "black",
      anim: 0,
      frame: 0, 
      flipped: -1,
      health: 40,
      maxHealth: 40,
      gold: 0,
      img: "bandit",
      }});
    players[pid] =  {
      player_id: pid,
      x: 50,
      y: 450,
      width: 90,
      height: 120,
      color: "black",
      anim: 0,
      frame: 0, 
      flipped: -1,
      health: 40,
      maxHealth: 40,
      gold: 0,
      img: "bandit",
      };
  })

  socket.on("CollectGold", function(goldData){
    io.emit("CollectGold", goldData);
    console.log(goldData)
    players[goldData.player].gold += 1;
    delete gold[goldData.id];
  })

  socket.on("disconnect", function() {
    socket.broadcast.emit("player_disconnect", socket.id);
    console.log("someone has left :(");
    delete players[socket.id];
  })
})
