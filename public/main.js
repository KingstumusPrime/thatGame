

// const socket = io("ws://localhost:8080", {transports: ["websocket"]});
const socket = io("https://banditbashapi.onrender.com/", {transports: ["websocket"]}
var canvas = document.querySelector("canvas");
var ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false; 

// object of all players
var players = {};
var uid = "";
var velocity = {x: 0, y: 1};
var objects = [];
var currKey = {};
var onGround;
var banditImage = document.querySelector("#LBandit");
var redImage = document.querySelector("#red");
var tileMap = document.querySelector("#map")
var frame = 0;
var flip = -1; // local version of flipped var sent to server
var attacking = false; // local variable that keeps track of wether or not the attack has finished;
var tSinceA = 0; // time since user attacked
var tSinceHurt = 0; // when player was last hit
var scroll = {x: 0, y: 0}; // amount game is scrolled by
const debug = true;
var dead = false; // is player dead
const maxSpeed = 13;
const gravity = 5;
const jumpHeight = 42;
var beat = new Audio('./public/assets/heart.wav');
beat.loop = true;

var map = [];
// client-side
socket.on("new_player", (arg) => {
    console.log(arg.player_id);
    players[arg.player_id] = arg;
    console.log(players[arg.player_id])
  });

socket.on("actualPlayers", (data) => {
    players = data.p;
    uid = data.uid;
    fetch("./public/map.json").then((response) => response.json()).then((json) => {
      console.log(json)
      let map = json["layers"][0].data;
      createObjects(32, map, 100);
      drawPlayers();
    });

});

socket.on("player_disconnect", (id) => {
    delete players[id];
});

socket.on("changeAnim", (animData) => {
  players[animData.id].anim = animData.anim;
  players[animData.id].flipped = animData.flipped;
  players[animData.id].frame = animData.frame;
  players[animData.id].color = animData.color;
})

socket.on("player_moved", (data) => {
  players[data.id].x += data.x;
  players[data.id].y += data.y;
})

socket.on("setPos", (data) => {
  players[data.id].x = data.x;
  players[data.id].y = data.y;
})



socket.on("damagePlayer" , function(HurtData) {
  if(HurtData.id == uid){
    frame = 0;
    tSinceHurt = 0;
    if((players[uid].health - HurtData.health)/players[uid].maxHealth <= 0.35){
      beat.play();
    }

  }
  players[HurtData.id].health -= HurtData.health;
  if(players[HurtData.id].health < 0){
    players[HurtData.id].health = 0;
  }
})

function getRndColor() {
  var r = 255*Math.random()|0,
      g = 255*Math.random()|0,
      b = 255*Math.random()|0;
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}

function createObjects(size, objs, width){
  for (let i = 0; i < objs.length; i++) {
    const element = objs[i];
    if(element != -1){
      const c = getRndColor(); 
      if(element == 0.19){
        objects.push({x: (i%width) * size, y: Math.floor(i/width)  * size, width: size, height: size, c: c, tile: element, type: "water"});
      }else{
        objects.push({x: (i%width) * size, y: Math.floor(i/width)  * size, width: size, height: size, c: c, tile: element, type: "solid"});
      }
    }
  }
}

document.addEventListener("keydown", function(event) {
  currKey[event.key] = true;
})

document.addEventListener("keyup", function(event) {
  currKey[event.key] = false;
})


function drawHealthBar(p, offset, color){
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 2;
  ctx.fillStyle = color;
  ctx.fillRect(p.x + offset.x + scroll.x, p.y + offset.y + scroll.y, (p.width * 0.8) * (p.health/p.maxHealth), p.height * 0.05);
  ctx.strokeRect(p.x + offset.x + scroll.x, p.y + offset.y + scroll.y, p.width * 0.8, p.height * 0.05);
}

function attack(attackData, p){
  if(debug){
    ctx.fillStyle = "red"
    ctx.globalAlpha = 0.3
    attackData.y += p.y;
    if(p.flipped == 1){
      ctx.fillRect(p.x - attackData.x + p.width/2 + scroll.x, p.y + attackData.y + scroll.y, attackData.width, attackData.height)
      attackData.x = p.x - attackData.x + p.width/2;
    }else{
      ctx.fillRect(p.x + attackData.x + scroll.x, p.y + attackData.y + scroll.y, attackData.width, attackData.height)
      attackData.x += p.x;
    }

  }
  for(play in players){
    if(play != uid){
      console.log(players[play])
      if(boxCollision(attackData, players[play])){
        console.log("KNOCKOUT");
        socket.emit("damagePlayer", { id:players[play].player_id, health: 10});
        return true;
      }
    }
  }
  return false;
}

function update(){
  frame += 1;
  tSinceA += 1;
  tSinceHurt += 1;
  if(currKey.ArrowRight){
    flip = -1;
  }else if(currKey.ArrowLeft){
    flip= 1
  }
  if(players[uid].health <= 0){
    if(!dead){
      socket.emit("changeAnim", {color: "yellow", anim: 3, frame: frame%7, flipped: flip});
    }else{
      socket.emit("changeAnim", {color: "yellow", anim: 4, frame: 4, flipped: flip});
    }

    if(frame%7 == 0 && frame > 0){
      dead = true;
    }
  }else if(!attacking){
    if(!onGround){
      socket.emit("changeAnim", {color: "orange", anim: 4, frame: 3, flipped: flip});
    }else if(velocity.x > 1|| velocity.x < -1){
      socket.emit("changeAnim", {color: "blue", anim: 1, frame: frame%8, flipped: flip});
    }else if(tSinceHurt < 4){
      socket.emit("changeAnim", {color: "red", anim: 4, frame: frame%3, flipped: flip});
    }else{
      socket.emit("changeAnim", {color: "black", anim: 0, frame: frame%4 + 4, flipped: flip});
    }
  }else{
    velocity.x = 0;
    if(tSinceA == 4){
      if(attack({x: players[uid].width * 0.8, y: 0, width: 60, height: players[uid].height/1.5}, players[uid])){
      }
    }
    if(tSinceA == 5){
      attacking = false;
    }
    socket.emit("changeAnim", {color: "green", anim: 2, frame: frame + 2%5, flipped: flip});
  }

  if(currKey["ArrowUp"]){
    // Move up by subtracting speed from top
    if(onGround){
      velocity.y -= jumpHeight;
    }
  }
  if(currKey["ArrowDown"]){
    // Move down by adding speed to top
    velocity.y += 2;
  }else if(currKey["ArrowLeft"]){
    // Move left by subtracting speed from left
    velocity.x = maxSpeed * -1;
  }else{
    velocity.x = 0;
  }
  if(currKey["ArrowRight"]){
    // Move right by adding speed to left
    velocity.x = maxSpeed;
  }

  if(currKey[" "]){
    if(onGround && tSinceA > 8){

      tSinceA = 0;
      frame = 0;
      attacking = true;

    }

  }
  const cPos = players[uid].x; // keep track of the real pos of player 
  const yPos = players[uid].y;
  if(cPos > canvas.width * 0.8 - scroll.x && velocity.x >= 0){
    scroll.x -= 10 + velocity.x;
  }else if(cPos < canvas.width * 0.2 - scroll.x && velocity.x <= 0){
    scroll.x += 10 - velocity.x;;
  }
  

  if(yPos > canvas.height * 0.6 - scroll.y && velocity.y >= 0){
    scroll.y -= 10 + velocity.y;
  }else if(yPos < canvas.height * 0.2 - scroll.y && velocity.y <= 0){
    scroll.y += 10 - velocity.y;
  }
}

function boxCollision(obj1, obj2){
  if(obj1.x + obj1.width  >= obj2.x &&
  obj1.x <= obj2.x + obj2.width &&
  obj1.y + obj1.height  >= obj2.y &&
  obj1.y <= obj2.y + obj2.height){return true}else{return false}
}
// A function to draw a single player on the canvas
function drawPlayer(player) {
  // Save the current context state
  ctx.save();
  // Set the fill style to the player's color
  ctx.fillStyle = player.color;
  // Draw a rectangle at the player's position and size
  if(debug){
    ctx.fillRect(player.x + scroll.x, player.y + scroll.y, player.width, player.height);
  }
  if(!dead){
    drawHealthBar(player, {x: player.width * 0.07, y: player.height * 0.14}, "green");
  }
  ctx.scale(player.flipped, 1);
  ctx.drawImage(banditImage, 48 * player.frame, 48 * player.anim, 48, 48, player.x * player.flipped + ((-18  + scroll.x) * player.flipped), player.y + scroll.y, 144 * player.flipped, 144);
  // Restore the context state
  ctx.restore();
}

function playerCollides(p, objs){
  var cp = p;
  onGround = false;
  cp.y += velocity.y;
  for(const obj in objs){
    if(boxCollision(cp, objs[obj]) && !onGround){

      if(velocity.y > 0){
          onGround = true;
          if( objs[obj].type != "water"){
            velocity.y = 0;
            players[uid].y = objs[obj].y - p.height - 0.01;
            socket.emit("setPos", {x:  players[uid].x + velocity.x, y: objs[obj].y - p.height - 0.01});
          }
      }
      if(velocity.y < 0 && objs[obj].type != "water"){
        velocity.y = 0;
        players[uid].y = objs[obj].y + objs[obj].height + 0.01;
        socket.emit("setPos", {x:  players[uid].x, y: objs[obj].y + objs[obj].height - 0.01});
      }
    }

  
  }
  cp.x += velocity.x;
for(const obj in objs){
  if(boxCollision(players[uid], objs[obj])){
    if(velocity.x > 0 && objs[obj].type != "water"){
      velocity.x = 0;
      socket.emit("setPos", {x: objs[obj].x - p.width - .01, y:players[uid].y});
      players[uid].x =  objs[obj].x - p.width - 0.01;
    }
    if(velocity.x < 0 && objs[obj].type != "water"){
      velocity.x = 0;
      socket.emit("setPos", {x: objs[obj].x + objs[obj].width + 0.01, y:players[uid].y});
      players[uid].x =  objs[obj].x + objs[obj].width + 0.01;
    }
    return
  }
}  

}


function drawPlayers() {
  update();
  ctx.globalAlpha = 1;
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);


  velocity.y += gravity;


  playerCollides(players[uid], objects);

  
  socket.emit("player_moved", {x: velocity.x , y: velocity.y});



  for (const objId in objects){
    if(debug){
      ctx.fillStyle = objects[objId].c;
      ctx.fillRect(objects[objId].x + scroll.x, objects[objId].y + scroll.y, objects[objId].width, objects[objId].height)
    }
    let tileY = objects[objId].tile;
    if((tileY + "").split(".")[1].length == 1){
      tileY = Math.round(tileY%1 * 10)
    }else{
      tileY = Math.round(tileY%1 * 100)
    }
    console.log(tileY)
    ctx.drawImage(tileMap, 16 *  Math.floor(objects[objId].tile), tileY * 16, 16, 16, objects[objId].x + scroll.x, objects[objId].y + scroll.y, objects[objId].width, objects[objId].height);
  }
  for (const playerId in players) {
    // Draw each player
    drawPlayer(players[playerId]);
    if(players[playerId] == uid){
      if((players[uid].health - HurtData.health)/players[uid].maxHealth <= 0.35){
        ctx.drawImage(redImage, 0, 0, canvas.width, canvas.height)
      }
    }
  }

  setTimeout(drawPlayers,100);
  
}

