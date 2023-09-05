function EmptyPage(message){
    document.getElementById('game').innerHTML = '';
    document.getElementById('game').innerHTML += 
    '<div id="loading"><div class="spinner-border text-primary" role="status"><span class="sr-only">Loading...</span></div>&nbsp;' + message + '</div>';
}

function Button(player, rating){
    document.getElementById('game').innerHTML = '';
    document.getElementById('game').innerHTML += '<h1 >Игрок: ' + player + '</h1>';
    document.getElementById('game').innerHTML += '<h2 >Рейтинг: ' + rating + '</h2>';
    document.getElementById('game').innerHTML += '<form action="/play" method="post">';
    document.getElementById('game').innerHTML += '<button onclick="playerPlay()" type="button" class="btn btn-primary">Быстрая игра</button>';
    document.getElementById('game').innerHTML += '</form>';
    document.getElementById('game').innerHTML += '<form style="margin-bottom: 50px;" action="/createLobby" method="post">';
    document.getElementById('game').innerHTML += '<button onclick="playerCreateLobby(' + player + ')" type="button" class="btn btn-primary">Создать лобби</button>';
    document.getElementById('game').innerHTML += '</form>';
    document.getElementById('game').innerHTML += '<dev></dev>'
    document.getElementById('game').innerHTML += '<form style="margin-bottom: 50px;" action="/connectLobby" method="post">';
    document.getElementById('game').innerHTML += '<button onclick="playerConnectLobby()" type="button" class="btn btn-primary">Присоеденится к лобби</button>';
    document.getElementById('game').innerHTML += '</form>';
}

function parseBoxId(idName) {
    return parseInt(idName.replace("block_", ""));
}

function GameMap(myname, opponent, bool) {
        document.getElementById('game').innerHTML = '';
        document.getElementById('myName').innerHTML = '';
        if (bool === true){
            document.getElementById('myName').innerHTML += 
            "<div id='gameProcess'><font color='blue'>" + myname + "</font>" + '  ' + "&mdash;" + '  ' + "<font color='red'><u>" + opponent + "</u>" + '   ' + "(Ход противника)</font></div>";
            for (var i=0; i<9; i++) {
                document.getElementById('game').innerHTML+='<div id="block_' + i + '" class="block"></div>';
            }
        }else{
            document.getElementById('myName').innerHTML += 
            "<div id='gameProcess'><font color='blue'>(Ваш ход)" + '   ' + "<u>" + myname + "</u></font>" + '  ' + "&mdash;" + '  ' + "<font color='red'>" + opponent + "</font></div>";
            for (var i=0; i<9; i++) {
                document.getElementById('game').innerHTML+='<div id="block_' + i + '" class="block"></div>';
            }
        }
}


function playerPlay(){
    socket.emit("checkbox", {});
}

function playerCreateLobby(player){
    socket.emit("createLobby", {});
    var idLobby = Math.floor(Math.random() * 9000) + 1000;
    document.getElementById('game').innerHTML = '';
    document.getElementById('game').innerHTML += '<h1 >Лобби: №' + idLobby + '</h1>';
    document.getElementById('game').innerHTML += '<h2>Игрок: ' + player + '<input style="margin-left: 50px;" type="color" id="color" name="" value="#e66465" /></h2>';
}

function exitInMainMenu(state){
    document.getElementById('game').innerHTML = '';
    document.getElementById('myName').innerHTML = '';
    document.getElementById('modal-wrapper').style.display='none';
    document.getElementById('winnerName').innerHTML = '';
    document.getElementById('exitGame').innerHTML = '';
    socket.emit("exit", {userState : state});
}

function Winner(myName, name){
    if (myName === name){
        document.getElementById('modal-wrapper').style.display='block';
        document.getElementById('winnerName').innerHTML = "<h1><b><font color='blue'>Вы победили!!!</font></b></h1>";
        document.getElementById('exitGame').innerHTML = '<button onclick="exitInMainMenu(true)" type="button" class="btn btn-outline-danger">Выход</button>';
    }else{
        document.getElementById('modal-wrapper').style.display='block';
        document.getElementById('winnerName').innerHTML = "<h1><b id='winner'><font color='Red'>Вы проиграли!!!</font></b></h1>";
        document.getElementById('winnerName').innerHTML += "<div>Победил игрок:<font color='Red'> " + name + "</font>!!!</div>";
        document.getElementById('exitGame').innerHTML = '<button onclick="exitInMainMenu(false)" type="button" class="btn btn-outline-danger">Выход</button>';
    }

}

function Draw() {
    document.getElementById('modal-wrapper').style.display='block';
    document.getElementById('winnerName').innerHTML = '<h1><b>Ничья!!!</b></h1>';
    document.getElementById('exitGame').innerHTML ='<button onclick="exitInMainMenu()" type="button" class="btn btn-outline-danger">Выход</button>';
}

EmptyPage('');

var socket = io.connect("/");



document.getElementById('game').onclick = function(event) {
    if (event.target.className == 'block') {
            boxId = parseBoxId(event.target.id);
            socket.emit("block", {blockNum : boxId});
        }
}


socket.on("mapBlue", (data) => {
    for (var i=0; i<9; i++) {
        if (data.map[i] === 1) {
            let str = "block_" + i;
            document.getElementById(str).innerHTML = '<img src="./img/CrossBlue.png" class="png">';
        }else {
            if (data.map[i] === 2) {
                let str = "block_" + i;
                document.getElementById(str).innerHTML = '<img src="./img/ZeroRed.png" class="png">';
            }
        }
    }
});

socket.on("mapRed", (data) => {
    for (var i=0; i<9; i++) {
        if (data.map[i] === 1) {
            let str = "block_" + i;
            document.getElementById(str).innerHTML = '<img src="./img/CrossRed.png" class="png">';
        }else {
            if (data.map[i] === 2) {
                let str = "block_" + i;
                document.getElementById(str).innerHTML = '<img src="./img/ZeroBlue.png" class="png">';
            }
        }
    }
});

socket.on("Name", (data) => {
    Button(data.userName, data.userRating);
});

socket.on("gameLaunch", (data) => {
    GameMap(data.myname, data.opponent, data.hod);
});

socket.on("EmptyPage", (data) => {
    EmptyPage(data.message);
});

socket.on("winner", (data) => {
    Winner(data.myName, data.Name);
});

socket.on("draw", () => {
    Draw();
});

socket.on('news', function (data) {
    console.log(data.hello);
    });