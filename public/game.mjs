import Collectible from './Collectible.mjs';
import Player from './Player.mjs';

const socket = io();

let currentPlayers = []
let me = null;
let keysDown = {};
let collectibles = [];

document.addEventListener("keydown", (ev) => {
    if (["KeyS", "KeyA", "KeyW", "KeyD"].includes(ev.code)) keysDown[ev.code] = true

})
document.addEventListener("keyup", (ev) => {
    if (["KeyS", "KeyA", "KeyW", "KeyD"].includes(ev.code)) keysDown[ev.code] = false

})

const canvas = document.getElementById('game-window');
const ctx = canvas.getContext('2d');


function update() {

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.reset()
    ctx.fillStyle = "slate"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = "gray"
    ctx.fillRect(10, 60, canvas.width-20, canvas.height-70)
    ctx.font = "25px serif"
    ctx.textAlign = "left"
    ctx.fillText("Controls: WASD", 10, 40)
    ctx.font = "30px serif"
    ctx.textAlign = "center"
    ctx.fillText("My Game", canvas.width/2, 40)
    ctx.font = "25px serif"
    ctx.textAlign = "right"
    if (keysDown && me) {
        if (keysDown['KeyS']) me.movePlayer("down", 4)
        if (keysDown['KeyW']) me.movePlayer("up", 4)
        if (keysDown['KeyA']) me.movePlayer("left", 4)
        if (keysDown['KeyD']) me.movePlayer("right", 4)
    }
    ctx.fillText(me ? me.calculateRank(currentPlayers) : "Loading", canvas.width-10, 40)
    for (let player of currentPlayers) {
        player.render()
    }

    for (let collectible of collectibles) {
        collectible.render();
        if (me?.collision(collectible)) {
            console.log("COLLISISIONINS")
            socket.emit('player:collected', { id: me.id, collectible: collectible.id })
        }
    }
    
}
setInterval(update, 20)
socket.on("player:new", (data) => {

    if (!currentPlayers.find((i) => i.id == data)) currentPlayers.push(new Player({ x: 100, y: 100, score: 0, id: data }))

});
socket.on("player:move", (data) => {
    let player = currentPlayers.find((i) => i.id == data.id)
    if (player && player.id != me.id)
        player.setPos(data.x ?? player.x, data.y ?? player.y)

})
socket.on("player:leave", (data) => {

    currentPlayers.splice(currentPlayers.findIndex((i) => i.id == data.id), 1);

})
socket.on("connected", (data) => {
    currentPlayers = data?.players?.map((i) => new Player(i));
    me = currentPlayers.find((i) => i.id == data.you)
    if (data.collectibles) collectibles = data.collectibles.map((collectible) => new Collectible(collectible))
})
socket.on("collectible:spawn", (data) => {
    collectibles.push(new Collectible(data))
})
socket.on("collectible:collected", (data) => {
    let player = currentPlayers.find((i) => i.id == data.id);
    let collectible = collectibles.find((i) => i.id == data.collectible);

    player.score += Number(collectible.value);

    collectibles.splice(collectibles.indexOf(collectible), 1)
})
socket.on("connect_error", (err) => {
    console.log(err);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = "center"
    ctx.font = "30px serif"
    ctx.fillText("Failed to connect", canvas.width/2, canvas.height/2)
  });
