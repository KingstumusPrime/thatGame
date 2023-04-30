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
}
var velocity = {x: 0, y: 0};
var players = {};
players[player.id] = player;

var changed = false;
var img = new Image();
var frame = 0;
img.onload = function(){
    setInterval(draw, 100)
}

var animMap = {
    0: {frames: 3, looping: true},
    1: {frames: 3, looping: true},
    2: {frames: 3, looping: false}
}

var tick = 0;
function draw(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if(players[player.id].y < canvas.height - players[player.id].height){
        players[player.id].y += 5;
        changed = true;
    }
    if (velocity.x != 0){
        if(velocity.x > 0){
            velocity.x -= 0.25;
        }else{
            velocity.x += 0.25;
        }
    }else{
        players[player.id].anim = 0;
    }
    if(velocity.y < 0){
        velocity.y += 1;
    }
    players[player.id].x += velocity.x;
    players[player.id].y += velocity.y;
    pubnub.publish({
        channel: pChannel,
        message: players[player.id]
    })
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
        players[player.id].anim = 1;
        if(velocity.x < 10){
            velocity.x += 3;
        }

        changed = true;
    } else if(e.key == "ArrowLeft"){
        players[player.id].anim = 1;
        if(velocity.x > -10){
            velocity.x -= 3;
        }
    } else if(e.key == "ArrowUp" && players[player.id].y == canvas.height - players[player.id].height){
        velocity.y -= 20;
    } else if(e.key == "ArrowDown"){
        players[player.id].anim = 2;
    }
    } 

)

// when we receive messages
pubnub.subscribe({
    channel: pChannel, // our channel name
    message: function(data) { // this gets fired when a message comes in
        if(player.id != data.id){
            console.log("YAY")
            players[data.id] = data;

        }


    }
});


function drawPlayer(iPlayer){
    ctx.beginPath();
    ctx.drawImage(img, iPlayer.frame * 32, iPlayer.anim * 32, 32, 32, iPlayer.x, iPlayer.y - 100, 200, 200);
    ctx.stroke();
}


img.src = "./player.png"