// load dependencies

var express = require("express");
var http = require("http");
var path = require("path");
var socketIO = require("socket.io");

// set port
var port = 8080;

// init framework

var players = {};

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
    height: 144,
    color: "black",
    anim: 0,
    frame: 0, 
    flipped: -1,
    health: 40,
    maxHealth: 40,
    };

  socket.emit("actualPlayers", {"p": players, "uid": socket.id}); //sends info back to that socket and not to all the other sockets
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


  socket.on("damagePlayer" , function(HurtData) {
    io.emit("damagePlayer", HurtData);

    players[HurtData.id].health -= HurtData.health;
    if(players[HurtData.id].health < 0){
      players[HurtData.id].health = 0;
    }
  })

  socket.on("new_bullet", function(bullet_data){
    socket.broadcast.emit("new_bullet", bullet_data);
  })

  socket.on("disconnect", function() {
    socket.broadcast.emit("player_disconnect", socket.id);
    console.log("someone has left :(");
    delete players[socket.id];
  })
})
