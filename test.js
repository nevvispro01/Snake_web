class Player {
    constructor(name) {
        this.name = name;
        this.socket = null;
    }
}

var players = [new Player('123'), new Player('345'), new Player('678')];
console.log(players);

let result = players.find(function(item, index, array){
    return item.name === '345';
});

result.socket = 12345;
console.log(players);