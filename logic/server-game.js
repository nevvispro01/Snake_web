const e = require("express");
const Balancer = require("./balancer");


const USER_RECONNECT_DELAY_MSEC = 30000;

class OnlinePlayer {
    constructor(sessionID, name, rating) {
        this.sessionID = sessionID;
        this.name = name;
        this.socket = null;
        this.playerPlay = false;
        this.room = null;

        this.isAlive = true;
        this.needRemove = false;
        this.rating = rating;
    }

    linkSocket(socket) {
        this.socket = socket;
        this.isAlive = true;
        this.socket.emit("Name", {userName : this.name, userRating : this.rating});
    }

    playerPlay2() {
        this.playerPlay = true;
        this.socket.emit("EmptyPage", {message : " Идет поиск соперника. Пожалуйста подождите..."});
    }

    gameLaunch(opponentName, bool) {
        this.socket.emit("gameLaunch", {myname : this.name, opponent : opponentName, hod : bool});
    }

    playerTurn(gameMap, opponentName, isActiveAction, blueOrRed) {
        this.socket.emit("gameLaunch", {myname : this.name, opponent : opponentName, hod : isActiveAction});
        if (blueOrRed === true){
            this.socket.emit("mapBlue", {map : gameMap});
        } else {
            this.socket.emit("mapRed", {map : gameMap});
        }
    }

    boxId2(boxId){
        this.room.gameProcess(boxId, this.name);
    }

    winner(name){
        if (this.socket) {
            this.socket.emit("winner", {myName: this.name, Name: name});
        }

    }

    draw() {
        if (this.socket) {
            this.socket.emit("draw", {});
        }
    }

    exit(rating) {
        this.rating = rating;
        this.socket.emit("Name", {userName : this.name, userRating : this.rating});
        this.playerPlay = false;
        this.room = null;
    }

    setAlived(isAlive) {
        this.isAlive = isAlive;
    }

    waitReconnect(session) {
        console.log("wait");
        if (this.needRemove) {
            return;
        }
        this.setAlived(false);
        setTimeout(() => {
            if (!this.isAlive) {
                console.log("NOT Alive");
                session.destroy();
                this.socket = null;
                this.needRemove = true;
                if (this.room) {
                    this.room.forceWin(this.name);
                }
            }
        }, USER_RECONNECT_DELAY_MSEC);
    }

    recoverySession() {
        if (this.room) {
            this.room.renderMap(this.name);
        }
    }
}

class Account {
    constructor(name, passwd){
        this.userName = name;
        this.password = passwd;
        this.rating = 0;
    }

    checkPasswd(passwd){
        if (passwd == this.password){
            return true;
        }
    }

    updateRating(state){
        if (state){
            this.rating += 10;
        }else if (this.rating <= 5){
            if (this.rating != 0){
                this.rating = 0;
            }
        }else{
            this.rating -= 5;
        }
        
    }

    getRating(){
        return this.rating;
    }
}


class GameServer {
    constructor() {
        this.accountList = new Map(); // (name, passwd)
        this.players = new Map(); //(sessionID, name, socket);
        this.room = new Map();    //(id, gameMap[], player1, player2);
        this.id = 0;
    }

    registerAccount(name, passwd){
        if (!this.accountList.has(name)){
            this.accountList.set(name, new Account(name, passwd));
            console.log("register", this.accountList);
            return true;
        }else{
            return false;
        }
    }

    existenceCheckAccount(name, passwd){
        
        return this.accountList.has(name) && this.accountList.get(name).checkPasswd(passwd);

    }

    // updateRatingAccount(nameAccount, state){
    //     // this.accountList.get(nameAccount).updateRating(state);
    //     console.log("update", this.accountList);
    //     console.log(this.accountList.get(nameAccount));
    // }

    // getRatingAccount(nameAccount){
    //     console.log("get", this.accountList);
    //     console.log(this.accountList.get(nameAccount));
    //     return 0;
    // }

    addPlayer(sessionID, name) {
        this.players.set(sessionID, new OnlinePlayer(sessionID, name, this.accountList.get(name).getRating()));
    }

    disconnect(sessionID){
        this.players.delete(sessionID);
    }

    linkSocketToPlayer(sessionID, socket) {
       if (this.players.has(sessionID)){
           this.players.get(sessionID).linkSocket(socket);
       }

        //result.socket = socket;
    } 

    hasplayer(sessionID) {
            return this.players.has(sessionID);
    }

    getName(sessionID) {
        if (this.players.has(sessionID)){
            return this.players.get(sessionID).name;
        }
    }

    PlayerPlay(sessionID) {
        if (this.players.has(sessionID)){
            this.players.get(sessionID).playerPlay2();
            balancer.tick(this.players.get(sessionID));
        }
    }

    addRoom(id){
        this.room.set(id, new Room(id));
    }

    createLobby(sessionID){
        var idLobby = Math.floor(Math.random() * 9000) + 1000;
    }
    
    // addPlayerRoom(id, player) {
    //     if (this.room.has(id)){
    //        this.room.get(id).addPlayerToRoom(player);  // Надо добавить проверку на добовление игрока в addPlayerToRoom
    //     }
    // }

    boxId(boxId, sessionID){
        if (this.players.has(sessionID)){
            this.players.get(sessionID).boxId2(boxId);
        }
    }

    findFreeRoom() {
        let isFoundId = false;
        this.id = 1;
        while(isFoundId === false){
            if (this.room.has(this.id)){
                if (this.room.get(this.id).player1 === null){
                    return this.room.get(this.id).id;
                }else {
                    if (this.room.get(this.id).player2 === null) {
                        return this.room.get(this.id).id;
                    }
                }
            }
            if (this.id === 10){
                isFoundId = true;
            }
            this.id++;
        }
        isFoundId = false;
        this.id = 1;
        while(isFoundId === false){
            if (this.room.has(this.id) === false){
                this.room.set(this.id, new Room(this.id));
                this.room.get(this.id).creatureGameMap();
                return this.room.get(this.id).id;
            }
            this.id++;
        }
    }
    

    exit(sessionID, state) {
        if (this.room.has(this.players.get(sessionID).room.id)){
            this.room.delete(this.players.get(sessionID).room.id)
        }
        console.log(this.accountList);
        this.accountList.get(this.getName(sessionID)).updateRating(state);
        this.players.get(sessionID).exit(this.accountList.get(this.getName(sessionID)).rating);
    }

    removeUnactivePlayers() {
        let idsForRemove = [];
        for (let player of this.players.values()) {
            if (!player.isAlive) {
                idsForRemove.push(player.sessionID);
            }
        }

        for (let id of idsForRemove) {
            this.players.delete(id);
        }
    }
}

var gameServer = new GameServer();
var balancer = new Balancer(gameServer);

class Room {
    constructor(id) {
        this.id = id;
        this.gameMap = [];
        this.player1 = null;
        this.player2 = null;
        this.hod = null;
        this.numberOfMoves = 0;
    }

    creatureGameMap(){
        for (var i=0; i<9; i++) {
            this.gameMap[i] = 0;
        }
    }

    gameProcess(boxId, name) {
        if (this.hod === name){
            if (this.gameMap[boxId] === 0){
                if (name === this.player1.name){
                    this.gameMap[boxId] = 1;
                    this.player1.playerTurn(this.gameMap, this.player2.name, true, true);
                    this.player2.playerTurn(this.gameMap, this.player1.name, false, false);
                    this.hod = this.player2.name;
                    this.numberOfMoves = this.numberOfMoves + 1;
                    this.checkWinner();
                }else{
                    if (name === this.player2.name){
                        this.gameMap[boxId] = 2;
                        this.player1.playerTurn(this.gameMap, this.player2.name, false, true);
                        this.player2.playerTurn(this.gameMap, this.player1.name, true, false);
                        this.hod = this.player1.name;
                        this.numberOfMoves = this.numberOfMoves + 1;
                        this.checkWinner();
                    }
                }
            }
        }
    }

    renderMap(playerName) {
        if (playerName === this.player1.name) {
            this.player1.playerTurn(this.gameMap, this.player2.name, this.hod != this.player1.name, true);
            this.checkWinner();
        } else {
            this.player2.playerTurn(this.gameMap, this.player1.name, this.hod != this.player2.name, false);
            this.checkWinner();
        }
    }

    addPlayerToRoom(player) {
        if (this.player1 === null){
            this.player1 = player;
        }else {
            if (this.player2 === null){
                this.player2 = player;
            }else{
                return false;
            }
        }
        return true;
    }

    randomInteger(min, max) {
        // случайное число от min до (max+1)
        let rand = min + Math.random() * (max + 1 - min);
        return Math.floor(rand);
      }

    gameLaunch() {
        if (this.randomInteger(1, 2) === 1){
            this.player1.gameLaunch(this.player2.name, false);
            this.player2.gameLaunch(this.player1.name, true);
            this.hod = this.player1.name;
        }else{
            let player = this.player1;
            this.player1 = this.player2;
            this.player2 = player;
            this.player1.gameLaunch(this.player2.name, false);
            this.player2.gameLaunch(this.player1.name, true);
            this.hod = this.player1.name;
        }
    }

    checkWinner(){
        if (this.gameMap[0] === 1  && this.gameMap[1] === 1 && this.gameMap[2] === 1) this.player1.winner(this.player1.name), this.player2.winner(this.player1.name);
        if (this.gameMap[3] === 1  && this.gameMap[4] === 1 && this.gameMap[5] === 1) this.player1.winner(this.player1.name), this.player2.winner(this.player1.name);
        if (this.gameMap[6] === 1  && this.gameMap[7] === 1 && this.gameMap[8] === 1) this.player1.winner(this.player1.name), this.player2.winner(this.player1.name);
        if (this.gameMap[0] === 1  && this.gameMap[3] === 1 && this.gameMap[6] === 1) this.player1.winner(this.player1.name), this.player2.winner(this.player1.name);
        if (this.gameMap[1] === 1  && this.gameMap[4] === 1 && this.gameMap[7] === 1) this.player1.winner(this.player1.name), this.player2.winner(this.player1.name);
        if (this.gameMap[2] === 1  && this.gameMap[5] === 1 && this.gameMap[8] === 1) this.player1.winner(this.player1.name), this.player2.winner(this.player1.name);
        if (this.gameMap[0] === 1  && this.gameMap[4] === 1 && this.gameMap[8] === 1) this.player1.winner(this.player1.name), this.player2.winner(this.player1.name);
        if (this.gameMap[6] === 1  && this.gameMap[4] === 1 && this.gameMap[2] === 1) this.player1.winner(this.player1.name), this.player2.winner(this.player1.name);

        if (this.gameMap[0] === 2  && this.gameMap[1] === 2 && this.gameMap[2] === 2) this.player1.winner(this.player2.name), this.player2.winner(this.player2.name);
        if (this.gameMap[3] === 2  && this.gameMap[4] === 2 && this.gameMap[5] === 2) this.player1.winner(this.player2.name), this.player2.winner(this.player2.name);
        if (this.gameMap[6] === 2  && this.gameMap[7] === 2 && this.gameMap[8] === 2) this.player1.winner(this.player2.name), this.player2.winner(this.player2.name);
        if (this.gameMap[0] === 2  && this.gameMap[3] === 2 && this.gameMap[6] === 2) this.player1.winner(this.player2.name), this.player2.winner(this.player2.name);
        if (this.gameMap[1] === 2  && this.gameMap[4] === 2 && this.gameMap[7] === 2) this.player1.winner(this.player2.name), this.player2.winner(this.player2.name);
        if (this.gameMap[2] === 2  && this.gameMap[5] === 2 && this.gameMap[8] === 2) this.player1.winner(this.player2.name), this.player2.winner(this.player2.name);
        if (this.gameMap[0] === 2  && this.gameMap[4] === 2 && this.gameMap[8] === 2) this.player1.winner(this.player2.name), this.player2.winner(this.player2.name);
        if (this.gameMap[6] === 2  && this.gameMap[4] === 2 && this.gameMap[2] === 2) this.player1.winner(this.player2.name), this.player2.winner(this.player2.name);

        if (this.numberOfMoves === 9) this.player1.draw(), this.player2.draw();
    }

    forceWin(loserName) {
        let winnerName = (loserName === this.player1.name) ? this.player2.name : this.player1.name;
        if (this.player1) {
            this.player1.winner(winnerName);
        }
        if (this.player2) {
            this.player2.winner(winnerName);
        }
    }
}

class Lobby {
    constructor(id) {
        this.id = id;
        this.gameMap = [];
        this.playersToLobby = []
    }
}

module.exports = GameServer;

