const request = require('request');
const creds = require('./creds');
const ifuncts = require('./ifuncts');
const ProgressBar = require('./ProgressBar');
// let url = "https://api.spotify.com/v1/users/puffballjack/playlists/6fnf5C8DGVZzYruRKckGRR/tracks?fields=items(track(name))";
let test;
// let pl = {tracks: []};
// let track = {};

function getBearerAuthCode() {
    return new Promise(function(resolve, reject){
        request.post({
            url: creds.BEARER_ACCESS_URL,
            headers: {
                "Authorization": creds.BASIC_AUTH_CODE
            },
            form: {
                grant_type: "client_credentials"
            },
            json: true
        }, function(err, res, body) {
            if (err) return reject(err);
            try {
                // console.log(body);
                // test = body;
                // console.log(test);
                // console.log(test.access_token)
                creds.BEARER_AUTH_CODE = 'Bearer ' + body.access_token;
                resolve(creds.BEARER_AUTH_CODE);
                // console.log(creds.BEARER_AUTH_CODE);
                // postOp(creds.BEARER_AUTH_CODE);/
            } catch(e) {
                reject(e);
            }
        });
    });
}

function getPlaylistLength(playlist, authCode) {
    return new Promise(function(resolve, reject){
        request.get({
            url: creds.consPlaylistTracksLink(playlist, 'items(track(name, id, album))'),
            headers:{
                "Authorization": authCode
            },
            json: true
        }, function(err, res, body) {
            if (err) return reject(err);
            try {
                // console.log(body.items[2].track.name);
                // pl.length = body.items.length;
                resolve(body.items.length);
                // test.push(body);
                // console.log(test);
            } catch(e) {
                reject(e);
            }
        });
    });
}

function getPlaylist(authCode, playlist) {
    var track = {};
    return new Promise(function(resolve, reject){
        // var num = 2;
        request.get({
            url: creds.consPlaylistTracksLink(playlist, 'items(track(name, id, album))'),
            headers:{
                "Authorization": authCode
            },
            json: true
        }, function(err, res, body) {
            if (err) return reject(err);
            try{
                resolve(body);
            } catch(e) {
                reject(e);
            }
        });
    });
}

function getPlaylistTrack(authCode, json, num) {
    var track = {};
    var body = json;
    return new Promise(function(resolve, reject){
        try {
            // console.log(body.items[2].track.name);
            track.id = body.items[num].track.id;
            track.name = body.items[num].track.name;
            track.artist = body.items[num].track.album.artists[0].name;
            resolve({authCode, track});
            // test.push(body);
            // console.log(test);
        } catch(e) {
            reject(e);
        }
    });
}

function getTrackLength(obj) {
    return new Promise(function(resolve, reject){
        var authCode = obj.authCode;
        var track = obj.track;
        var id = track.id;
        request.get({
            url: creds.TRACK_LENGTH_URL(id),
            headers:{
                "Authorization": authCode
            },
            json: true
        }, function(err, res, body) {
            if (err) return reject(err);
            try {
                // console.log(body.track.duration.round())
                track.length = body.track.duration.round();
                // resolve(body.track.duration.round());
                resolve(track);
            } catch(e) {
                reject(e);
            }
        });
    });   
}


// getBearerAuthCode().then(function(val) {
//     console.log(val);
// })

function makeTrackObj(json, num) {
    return new Promise(function(resolve, reject) {
        try {
            getBearerAuthCode()
            .then(authCode => getPlaylistTrack(authCode, json, num))
            // .then(val => console.log(val))
            .then(obj => getTrackLength(obj))
            .then(function(track){ 
                resolve(track)
            })
            .catch(err => reject(err));
        } catch(e) {
            reject(e);
        }
    });
}

// function addTrackToPl(playlist, num) {
//     makeTrackObj(playlist, num)
//     .then(function(val) {
//         pl.tracks.push(val);
//         // console.log(val);
//     })
//     .catch(err => console.error(err))
// }

// function addAllTracksToPl(playlist, callback) {
//     getBearerAuthCode()
//     .then(val => getPlaylistLength(playlist, val))
//     .then(function(length) {
//         for(var i=0; i < length; i++)
//         {
//             addTrackToPl(playlist, i);
//         }
//         console.log(pl);
//     })
// }

async function createPlObject(playlist) {
    var Bar = new ProgressBar;
    var pl = {tracks: []}
    var authCode = await getBearerAuthCode();
    var json = await getPlaylist(authCode, playlist);

    pl.length = await getPlaylistLength(playlist, authCode);

    Bar.init(pl.length, 'Fetching Tracks');

    for(var i=0; i<pl.length; i++) {
        var obj = await makeTrackObj(json, i);
        pl.tracks.push(obj);
        // console.log((i+1) + '/' + pl.length);
        // cliUpdate((i+1), pl.length)
        Bar.update((i+1));
    }

    Bar.close();

    return pl;

    // var rand = await makeTrackObj(playlist, 2);
    // console.log(rand);
}

function cliUpdate(updateVal, fixedVal){
    printVal = updateVal + '/' + fixedVal;
    process.stdout.clearLine();
    if(updateVal !== fixedVal){
        process.stdout.cursorTo(0);
        process.stdout.write(printVal);
    } else {
        process.stdout.cursorTo(0);
        process.stdout.write(printVal + '\n\n')
    }
}

// async function run(playlist) {
//     var howdy = await createPlObject(playlist);
//     console.log(howdy.tracks);
// }


// run(process.argv[2]);

module.exports.createPlObject = createPlObject;

// const fetch = require('node-fetch');
// const fs = require('fs');

// link = 'http://newtabs.stream/kuWBZB:AnD3rB';
// // link = 'https://assets-cdn.github.com/images/modules/logos_page/Octocat.png'

// function download(link) {
//     fetch(link).then(res => {
//         var dest = fs.createWriteStream("file.mp3")
//         res.body.pipe(dest);
//     })
// }

// download(link);