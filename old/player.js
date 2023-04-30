canvas = document.querySelector("canvas");
var ctx = canvas.getContext("2d");
ctx.mozImageSmoothingEnabled = false; 
ctx.imageSmoothingEnabled = false; 
const pChannel = "multiplayerGame/players"
const id = Math.random() * 1000000
var player = {
    x: 100,
    y: 100,
    width: 150,
    height: 100,
    id: id,
    frame: 0,
    anim: 1,
    flipped: 1,
}
var velocity = {x: 0, y: 0};
var players = {};
players[player.id] = player;

var changed = false;
var img = new Image();
var frame = 0;
img.onload = function(){
    pubnub.publish({
        channel: pChannel,
        message: {type: "join", p: player}
    })
    setInterval(draw, 100)
}

var animMap = {
    0: {frames: 3, looping: true},
    1: {frames: 3, looping: true},
    2: {frames: 3, looping: false}
}

var keys = {up: false, left: false, down: false, right:false};

var tick = 0;
function draw(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if(players[player.id].y + velocity.y  > canvas.height - players[player.id].height){
        velocity.y = 0;
        changed = true;
    }else{
        velocity.y += 1;
    }
    if (velocity.x != 0){
        if(velocity.x > 0){
            velocity.x -= 0.5;
        }else{
            velocity.x += 0.5;
        }
    }else if(!keys.down){
        players[player.id].anim = 0;
    }
    players[player.id].y += velocity.y;

    for (const key in players) {
        drawPlayer(players[key]);
    }
    changed = false;
    tick += 1;
    if(tick%1 == 0){
        if(players[player.id].frame < 3){
            players[player.id].frame += 1;
        }else{
            if(animMap[players[player.id].anim].looping){
                players[player.id].frame = 0;
            }else{
                players[player.id].anim = 0;
            }

        }
    }
}


document.addEventListener("keydown", (e) => {
    console.log(e.key)
    if(e.key == "ArrowRight"){
        keys.right = true
        players[player.id].anim = 1;
        players[player.id].flipped = 1;

        pubnub.publish({
            channel: pChannel,
            message: {type: "key", change: "x", amount: 15, id:player.id}
        })
        
        changed = true;
    } else if(e.key == "ArrowLeft"){
        keys.left = true;
        players[player.id].anim = 1;
        players[player.id].flipped = -1;

        pubnub.publish({
            channel: pChannel,
            message: {type: "key", change: "x", amount: -15, id:player.id}
        })
        
    } else if(e.key == "ArrowUp" && players[player.id].y + velocity.y  > canvas.height - players[player.id].height){
        velocity.y -= 12;
        keys.up = true;
    } else if(e.key == "ArrowDown"){
        players[player.id].anim = 2;
    }
    } 

)


document.addEventListener("keyup", (e) => {
    console.log(e.key)
    if(e.key == "ArrowRight"){
        keys.right = false

    } 
    if(e.key == "ArrowLeft"){
        keys.left = false;

    } 
    if(e.key == "ArrowUp" && players[player.id].y == canvas.height - players[player.id].height){
        keys.up = false;

    } 
    if(e.key == "ArrowDown"){
        keys.down = false;
    }
    } 

)

// when we receive messages
pubnub.subscribe({
    channel: pChannel, // our channel name
    withPresence: true,
    message: function(data) { // this gets fired when a message comes in
        console.log(data)
        if(data.type == "join"){
            players[data.p.id] = data.p;
            
        }else if(data.type == "key"){
            if(players[data.id] == undefined){
                players[data.id]
            }
            if(data.change == "x"){
                console.log("A")
                players[data.id].x += data.amount;
            }

        }
    }
});


function drawPlayer(iPlayer){
    
    ctx.save();
    ctx.scale(iPlayer.flipped, 1);
    ctx.drawImage(img, iPlayer.frame * 32, iPlayer.anim * 32, 32, 32, iPlayer.x * iPlayer.flipped, iPlayer.y - 100, iPlayer.flipped * 200, 200);
    ctx.restore();

}
img.src = "./player.png"