const express = require("express");
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const GameServer = require("./logic/server-game");
const Balancer = require("./logic/balancer");
const cookieParser = require("cookie-parser");
const { request } = require("http");
const { Socket } = require("dgram");

const app = express();


const USER_RECONNECT_DELAY_MSEC = 30000;
const host = '0.0.0.0';
const port = 7000;

var sessionMiddleware = session({
    secret: "secret"
});

app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'static')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(sessionMiddleware);

app.locals.gameServer = new GameServer();
app.locals.balancer = new Balancer(app.locals.gameServer);

cleanPlayersList = () => {
    setTimeout(function() {
        app.locals.gameServer.removeUnactivePlayers();
        cleanPlayersList();
    }, 1000);
}
cleanPlayersList();

app.get('/', (req, res) => {
    let gameServer = app.locals.gameServer;
    if (gameServer.hasplayer(req.sessionID)) {
        res.redirect("/play");
        return;
    } else {
        console.log("no login");
    }
    res.render("index");
});

app.post("/login", (req, res) => {
    let gameServer = app.locals.gameServer;
    if (req.body.username && req.body.password) {
        let name = req.body.username;
        let passwd = req.body.password;
        if (gameServer.existenceCheckAccount(name, passwd)){
            console.log("Login user: ", name);
            gameServer.addPlayer(req.sessionID, name);
            res.redirect("/game");
        }
        
    }
});

app.post("/transition_to_registration", (req, res) => {
    res.redirect("/registration");
});

app.post("/register", (req, res) => {
    if (req.body.password1 == req.body.password2){
        let gameServer = app.locals.gameServer;
        let newUserName = req.body.username;
        let passwd = req.body.password1;
        if (req.body.username) {
            if (gameServer.registerAccount(newUserName, passwd)){
                console.log("Register user: ", newUserName);
                gameServer.addPlayer(req.sessionID, newUserName);
                res.redirect("/game");
            }
            
        }
    }
});

app.get("/registration", (req, res) => {
    res.render("registration");

});


app.get("/game", (req, res) => {
    let gameServer = app.locals.gameServer;
    let name = "";
    if (gameServer.hasplayer(req.sessionID)) {
        name = gameServer.getName(req.sessionID);
        console.log("Username: ", name);
    } else {
        console.log("no login");
        res.redirect("/");
        return;
    }
        res.render("game", {username: name});
});


server = app.listen(port, host, function() {
    console.log(`Server listens http://${host}:${port}`);

});

const socketIO = require("socket.io")(server);
// var socketIO = socketIO.listen(server);

socketIO.use(function(socket, next) {
    sessionMiddleware(socket.request, socket.request.res, next);
});

socketIO.on("connection", socket => {
    socket.request.session;

    if (app.locals.gameServer.hasplayer(socket.request.sessionID)
        && !app.locals.gameServer.players.get(socket.request.sessionID).isAlive) {
        app.locals.gameServer.linkSocketToPlayer(socket.request.sessionID, socket);
        app.locals.gameServer.players.get(socket.request.sessionID).recoverySession();
    } else {
        app.locals.gameServer.linkSocketToPlayer(socket.request.sessionID, socket);
    }

    socket.on("disconnect", (reason) => {
        if (app.locals.gameServer.hasplayer(socket.request.sessionID)) {
            app.locals.gameServer.players.get(socket.request.sessionID).waitReconnect(socket.request.session);
        }
        setTimeout(() => {
            console.log("disconnect");
            app.locals.gameServer.disconnect(socket.request.sessionID);
            // socket.request.session.destroy();
        }, USER_RECONNECT_DELAY_MSEC);
        
    });

    socket.on("block", (data) => {
        app.locals.gameServer.boxId(data.blockNum, socket.request.sessionID);
    });

    socket.on("checkbox", () => {
        app.locals.gameServer.PlayerPlay(socket.request.sessionID);
    });

    socket.on("exit", (data) => {
        app.locals.gameServer.exit(socket.request.sessionID, data.userState);
    });

    socket.on("createLobby", (data) => {
        app.locals.gameServer.createLobby(socket.request.sessionID);
    });

});



setTimeout(function() {
    socketIO.emit("test", {});
    console.log("send test");
}, 10000);
