const runCallbackTimeoutMsec = 1000;
const GameServer = require("./server-game");



class Balancer {
    constructor(gameServer) {
        this.gameServer = gameServer;
    }

    tick(player) {
        let id;
        this.gameServer.removeUnactivePlayers();
        if ((player.playerPlay === true) && (player.room === null)) {
            id = this.gameServer.findFreeRoom(); // здесь я получаю id комнаты в которую буду закидывать играков
            if (this.gameServer.room.get(id).addPlayerToRoom(player) === true){ 
                player.room = this.gameServer.room.get(id);
                if ((this.gameServer.room.get(id).player1 != null) && (this.gameServer.room.get(id).player2 != null)) {
                    this.gameServer.room.get(id).gameLaunch();
                }
            }
        }
    }
}

module.exports = Balancer;