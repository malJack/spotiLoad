const fetch = require('node-fetch');
const fs = require('fs');

Number.prototype.round = function (){
    return Math.round(this);
}

String.prototype.download = function() {
    if(this !== false) {
        fetch(this).then(res => {
            var dest = fs.createWriteStream("file1.mp3")
            res.body.pipe(dest);
        })
    }
    else {
        console.error(track.name + ' by ' + track.artist + 'Song with specified length was not found.')
    }
}

String.prototype.toSeconds = function() {
    var a = this.split(':');
    var seconds;
    if(a.length === 2) {
        seconds = ((+a[0]) * 60 + (+a[1]));
    }
    return seconds;
}

Number.prototype.toMinutes = function() {
    var retValA = (this/60).toFixed();
    var retValB = (this%60);
    if(retValB.toString().length <= 1){
        retValB = `0${retValB.toString()}`
    }
    var retVal = `${retValA}:${retValB}`;
    return retVal;
}

module.exports = String;
module.exports = Number;
