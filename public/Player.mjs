const CANVAS_BOUND_X = 590,
CANVAS_BOUND_Y = 380;
const socket = io();
const img = new Image();
img.src='./public/character.jpg';
const canvas = document.getElementById('game-window');
const ctx = canvas.getContext('2d');

class Player {
  constructor({x, y, score, id}) {
    this.x = x;
    this.y = y;
    this.score = score;
    this.id = id;

  }
  render() {

    ctx.drawImage(img,this.x+10,this.y+60,32,32);
    ctx.font = "15px serif"
    ctx.fillStyle = "black"
    ctx.textAlign = "center"
    ctx.fillText('Player #'+this.id, this.x+30, (this.y+50))
  }
  setPos(newX, newY) {
    if (newX >= CANVAS_BOUND_X || newX <= 0) return;
    if (newY >= CANVAS_BOUND_Y || newY <= 0) return;
    if (newX) this.x = newX;
    if (newY) this.y = newY;
  }
  movePlayer(dir, speed) {
    switch (dir){
      case "left":
        this.setPos(this.x - speed, undefined)
        socket.emit('player:move', { id: this.id, x: -speed })
        break;
      case "right":
        this.setPos(this.x + speed, undefined)
        socket.emit('player:move', { id: this.id, x: speed })
        break;
      case "up":
        this.setPos(undefined, this.y - speed)
        socket.emit('player:move', { id: this.id, y: -speed })
        break;
      case "down":
        this.setPos(undefined, this.y + speed)
        socket.emit('player:move', { id: this.id, y: speed })
        break;
    }
      
  }
  
  collision(item) {
    if (!item) return false;
    if (
      this.x < item.x + item.w &&
      this.x + 32 > item.x &&
      this.y < item.y + item.h &&
      this.y + 32 > item.y
    ) {
      
      return true;
    }
    return false;
  }

  calculateRank(arr) {
    return 'Rank: ' + (arr.sort((a,b) => b.score-a.score).indexOf(this)+1) + '/' + arr.length
  }
}

export default Player;
