

// const socket = io("ws://localhost:8080", {transports: ["websocket"]});
const socket = io("https://banditbashapi.onrender.com/", {transports: ["websocket"]})
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
// Images
var banditImage = document.querySelector("#LBandit");
const redImage = document.querySelector("#red");
const tileMap = document.querySelector("#map")
const cityTileMap = document.querySelector("#cityMap")
const goldTiles = document.querySelector("#gold");
var frame = 0;
var flip = -1; // local version of flipped var sent to server
var attacking = false; // local variable that keeps track of wether or not the attack has finished;
var tSinceA = 0; // time since user attacked
var tSinceHurt = 0; // when player was last hit
var scroll = {x: 0, y: 0}; // amount game is scrolled by
const debug = false;
var dead = false; // is player dead
const maxSpeed = 13;
const gravity = 5;
const jumpHeight = 46;
// all of the gold on the map
var gold = {};
var beat = new Audio('./public/assets/heart.wav');
beat.loop = true;

var map = [];
// client-side
socket.on("new_player", (arg) => {
    players[arg.player_id] = arg;
  });

socket.on("actualPlayers", (data) => {
    players = data.p;
    uid = data.uid;
    gold = data.gold;
    for(const g in gold){
      gold[g].width = players[uid].width * 0.5;
      gold[g].height = players[uid].width * 0.5;
    }
    fetch("./public/newMap.json").then((response) => response.json()).then((json) => {
      let map = json["layers"][0].data;
      createObjects(32, map, 175, "envir");
      map = json["layers"][1].data;
      createObjects(32, map, 175, "city");
      drawPlayers();
    });

});

socket.on("player_disconnect", (id) => {
    const quitP = players[id]
    delete players[id];
    if(uid == Object.keys(players)[0]){
      for(let i = 0; i < quitP.gold; i++){
        console.log(uid + i)
        const t = Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01;
        socket.emit("addGold", {id: uid + i, gold: {
          "x": quitP.x + (Math.floor(Math.random() * quitP.width * 2) - quitP.width) + quitP.width/2,
          "y": quitP.y + 72,
          "w": 16,
          "h": 16,
          type: t,
        }})
      }
    }
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


socket.on("CollectGold", function(goldData) {
  players[goldData.player].gold += 1;
  console.log(goldData);
  delete gold[goldData.id];
})

socket.on("resetPlayer", function(data) {
  players[data.id] = data.player;
  if(data.id == uid){
    dead = false;
    scroll.x = 0;
    scroll.y = 0;
  }
})

socket.on("addGold", function(goldData) {
  gold[goldData.id] = goldData.gold;
  gold[goldData.id].height = players[uid].width * 0.5;
  gold[goldData.id].width = players[uid].width * 0.5;
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

function createObjects(size, objs, width, type){
  for (let i = 0; i < objs.length; i++) {
    const element = objs[i];
    if(element != -1){
      const c = getRndColor(); 
      if(element == 0.19 && type == "envir"){
        objects.push({x: (i%width) * size, y: Math.floor(i/width)  * size, width: size, height: size, c: c, tile: element, type: "water", art: "envir"});
      }else{
        objects.push({x: (i%width) * size, y: Math.floor(i/width)  * size, width: size, height: size, c: c, tile: element, type: "solid", art: type});
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

  }else{
    if(p.flipped == 1){
      attackData.x = p.x - attackData.x + p.width/2;
    }else{
      attackData.x += p.x;
    }
    attackData.y += p.y;
  }
  for(play in players){
    if(play != uid){
      if(boxCollision(attackData, players[play])){
        socket.emit("damagePlayer", { id:players[play].player_id, health: 10});
        return true;
      }
    }
  }
  return false;
}

function update()
{
  if(dead && tSinceHurt > 120){
    socket.emit("resetPlayer", uid);
  }
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
      for(let i = 0; i < players[uid].gold; i++){
        console.log(uid + i)
        const t = Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01;
        socket.emit("addGold", {id: uid + i, gold: {
          "x": players[uid].x + (Math.floor(Math.random() * players[uid].width * 2) - players[uid].width) + players[uid].width/2,
          "y": players[uid].y + 72,
          "w": 16,
          "h": 16,
          type: t,
        }})
      }
      players[uid].gold = 0;
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
  if(players[uid].y > 1600){
    socket.emit("resetPlayer", uid);
    for(let i = 0; i < players[uid].gold; i++){
      console.log(uid + i)
      const t = Math.floor(Math.random() * (15-4+1)+4) + Math.floor(Math.random() * (13-4+1) + 4) * 0.01;
      socket.emit("addGold", {id: uid + i, gold: {
        "x":453 + (Math.floor(Math.random() * players[uid].width * 2) - players[uid].width) + players[uid].width/2,
        "y": 968 + 72,
        "w": 16,
        "h": 16,
        type: t,
      }})
    }
    players[uid].gold = 0;
  }
  if(!dead){
    if(currKey["ArrowUp"]){
      // Move up by subtracting speed from top
      if(onGround){
        velocity.y = jumpHeight * -1;
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
    drawHealthBar(player, {x: player.width * 0.07, y: -player.height * 0.1}, "green");
    ctx.fillStyle = "gold";
    ctx.font = "18px Helvetica";
    ctx.fillText(player.gold, player.x + player.width * 0.5 + scroll.x, player.y +  10 + scroll.y, player.width);
  }
  ctx.scale(player.flipped, 1);
  ctx.drawImage(banditImage, 48 * player.frame, 48 * player.anim, 48, 48, player.x * player.flipped + ((-18  + scroll.x) * player.flipped), (player.y + scroll.y ) - 20, 144 * player.flipped, 144);
  // Restore the context state
  ctx.restore();
}

function playerCollides(p, objs){
  var cp = p;
  onGround = false;
  cp.y += velocity.y;
  for(const obj in objs){
    if(boxCollision(cp, objs[obj])){
      if(objs[obj].type != "water"){
        if(velocity.y > 0){
          onGround = true;
          velocity.y = 0;
          players[uid].y = objs[obj].y - p.height - 0.01;
          socket.emit("setPos", {x:  players[uid].x + velocity.x, y: objs[obj].y - p.height - 0.01});
        }
        if(velocity.y < 0){
          velocity.y = 0;
          onGround  = false;
          players[uid].y = objs[obj].y + objs[obj].height + 0.01;
          socket.emit("setPos", {x:  players[uid].x, y: objs[obj].y + objs[obj].height - 0.01});
          velocity.y = 4;
          velocity.x = 0;
          break;
        }
      }else{
        onGround  = true;
      }
    }

  
  }
  cp.x += velocity.x;
for(const obj in objs){
  if(boxCollision(players[uid], objs[obj])){
    if(objs[obj].type != "water"){
      if(velocity.x > 0){
        velocity.x = 0;
        socket.emit("setPos", {x: objs[obj].x - p.width - .01, y:players[uid].y});
        players[uid].x =  objs[obj].x - p.width - 0.01;
      }
      if(velocity.x < 0){
        velocity.x = 0;
        socket.emit("setPos", {x: objs[obj].x + objs[obj].width + 0.01, y:players[uid].y});
        players[uid].x =  objs[obj].x + objs[obj].width + 0.01;
      }
      return
    }
  }
}  

}

function goldCollides(gId){
  if(boxCollision(players[uid], gold[gId])){
    console.log("MINE MINE MINE MINE");
    socket.emit("CollectGold", {"id": gId, "player": uid});
  }
}

function drawPlayers() {
  update();
  ctx.globalAlpha = 1;
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);


  velocity.y += gravity;  
  socket.emit("player_moved", {x: velocity.x, y: velocity.y})
  playerCollides(players[uid], objects);
  



  for (const objId in objects){
    if(debug){
      ctx.fillStyle = objects[objId].c;
      ctx.fillRect(objects[objId].x + scroll.x, objects[objId].y + scroll.y, objects[objId].width, objects[objId].height)
    }
    let tileY = objects[objId].tile;
    if(Math.floor(tileY) == tileY){
      tileY = 0;
    }else {
      if((tileY + "").split(".")[1].length == 1){
        tileY = Math.round(tileY%1 * 10)
      }else{
        tileY = Math.round(tileY%1 * 100)
      }
      if(objects[objId].art == "envir"){
        ctx.drawImage(tileMap, 16 *  Math.floor(objects[objId].tile), tileY * 16, 16, 16, objects[objId].x + scroll.x, objects[objId].y + scroll.y, objects[objId].width, objects[objId].height);
      }else{
        ctx.drawImage(cityTileMap, 16 *  Math.floor(objects[objId].tile), tileY * 16, 16, 16, objects[objId].x + scroll.x, objects[objId].y + scroll.y, objects[objId].width, objects[objId].height);
      }
    }
  }
  for (const playerId in players) {
    // Draw each player
    drawPlayer(players[playerId]);
    if(playerId == uid){
      if(players[uid].health/players[uid].maxHealth <= 0.35){
        ctx.drawImage(redImage, 0, 0, canvas.width, canvas.height)
      }
    }
  }
  for (const g in gold){

    let tileY = gold[g].type;
    if((tileY + "").split(".")[1].length == 1){
      tileY = Math.round(tileY%1 * 10)
    }else{
      tileY = Math.round(tileY%1 * 100)
    }
    if(players[uid].health > 0){
      goldCollides(g);
    }
    ctx.drawImage(goldTiles, gold[g].w * Math.floor(gold[g].type), gold[g].w * tileY, gold[g].w, gold[g].h, gold[g].x + scroll.x, gold[g].y + scroll.y, players[uid].width * 0.5,players[uid].width * 0.5);
  }
  setTimeout(drawPlayers,100);
  
}

