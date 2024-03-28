const canvas = document.getElementById('game-window');
const ctx = canvas.getContext('2d');
class Collectible {
  constructor({x, y, value, id}) {
    this.x = x
    this.y = y
    this.value = value
    this.id = id
    this.w = 10
    this.h = 10
  }
  
  render() {
    switch (this.value) {
      case 3:
        ctx.fillStyle = "blue"
        break;
      case 2:
        ctx.fillStyle = "yellow"
        break;
      default:
        ctx.fillStyle = "brown"
        break;
    }

    ctx.fillRect(this.x+10, this.y+60, 10, 10);
  }
}

try {
  module.exports = Collectible;
} catch(e) {}

export default Collectible;
