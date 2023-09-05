const CellValue = {
    Empty: 0,
    X: 1,
    O: 2
}


class GameMap {
    constructor() {
        this.map = [];
        for (let i = 0; i < 9; i++) {
            this.map.push([]);
        }
    }

    cellIsEmpty(cellNum) {
        return this.map[cellNum] === CellValue.Empty;
    }

    setCellValue(cellNum, value) {
        if (this.map.has(cellNum)) {
            this.map[cellNum] = value;
        }
    }
}


class Room {
    constructor(roomId, player1, player2) {
        this.id = roomId;
        this.player1 = player1;
        this.player2 = player2;
        this.isActivePlayer1 = true;
        this.gameMap = new GameMap();
    }

    getActivePlayerName() {
        if (this.isActivePlayer1) {
            return this.player1.name;
        }
        return this.player2.name;
    }

    isEndGame() {
        return false // TODO: реализовать анализ конца игры
    }

    isWinner(playerName) {
        return false; // TODO: реализовать определение победителя
    }

    // method action() return: [aктивен ли игрок, состояние карты, закончена ли игра, игрок победил]
    action(playerName, cellNum) {
        if (this.isActivePlayer1) {
            if (playerName === this.player1.name) {
                if (this.gameMap.cellIsEmpty(cellNum)) {
                    this.gameMap.setCellValue(CellValue.X);
                }
                this.isActivePlayer1 = false;
            }
            return [this.isActivePlayer1, this.gameMap.map, this.isEndGame(), this.isWinner(playerName)];
        } else {
            if (playerName === this.player2.name) {
                if (this.gameMap.cellIsEmpty(cellNum)) {
                    this.gameMap.setCellValue(CellValue.O);
                }
                this.isActivePlayer1 = true;
            }
            return [!this.isActivePlayer1, this.gameMap.map, this.isEndGame(), this.isWinner(playerName)];
        }
    }
}


class GameHandler {
    constructor() {
        this.rooms = new Map(); // [int roomId, Room room]
    }

    getNextRoomId() {
        let id = 1;
        while (this.rooms.has(id)) { id++; }
        return id;
    }

    addRoom(player1, player2) {
        let roomId = this.getNextRoomId();
        newRoom = new Room(roomId, player1, player2);
        player1.linkToRoom(roomId);
        player2.linkToRoom(roomId);
    }

    // method action() return: [aктивен ли игрок, состояние карты, закончена ли игра, игрок победил]
    action(roomId, playerName, cellNum) {
        return this.rooms[roomId].action(playerName, cellNum);
    }
}

module.exports = GameHandler;