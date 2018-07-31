const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fetch = require('node-fetch');
const fs = require('fs');
const color = require('chalk');

const creds = require('./creds');
const ifuncts = require('./ifuncts');
const spotify = require('./spotify');
const ProgressBar = require('./ProgressBar');
// const spotify =  require('./spotify');

const SEARCH_FIELD = '#query';
const SEARCH_BUTTON = 'body > div.wrapper > div > div > div.input-group > span.input-group-btn > button';
// const SEARCH_INPUT = 'milk brockhampton';
// console.log(SEARCH_INPUT);

const DOWNLOAD_BUTTON = '#result > div.list-group > li:nth-child(1) > div > a:nth-child(4)';

async function run() {
    var robj = {};
    // var badTracks = [];
    var playlist = await spotify.createPlObject(process.argv[2]);
    var sBar = new ProgressBar;

    const browser = await puppeteer.launch({
        headless: true
    });
    const page = await browser.newPage();

    sBar.init(playlist.length, 'Starting Downloads')

    await page.goto('https://my-free-mp3.net/');

    for(var i=0; i<playlist.length; i++) {
        var times = [];
        var link = {status: true};
        var track = playlist.tracks[i];
        track.success = true;

        // var track =  { id: '14oQGWPqh5BriU78hT19CE',
        // name: 'Enemy',
        // artist: 'Oliver Tree',
        // length: 114};

        const SEARCH_INPUT = track.name + ' ' + track.artist;

        // await page.goto('https://my-free-mp3.net/');

        await page.click(SEARCH_FIELD, {clickCount: 3});
        await page.keyboard.type(SEARCH_INPUT);

        await page.click(SEARCH_BUTTON);

        await page.waitFor(3000);

        try{
            await page.waitForSelector(DOWNLOAD_BUTTON, {timeout: 3000});
        } catch(err) {
            // console.error(err);
            link.status = false;
            link.reason = 'none found';
        }

        let content = await page.content();
        var $ = cheerio.load(content);
        if(link.status !== false) {
            $('#result div.list-group').each(function(data) {
                // $(this).find('a.btn.btn-primary.btn-xs').each(function(data) {
                //     console.log($(this).text())
                // })
                $(this).find('a.btn.btn-primary.btn-xs').each(function(data) {
                    if($(this).text().trim() !== 'Size - Kbps' && $(this).text().trim() !== 'Download') {
                        times.push($(this).text().trim().toSeconds());
                    }
                })
                $(this).find('a.name').each(function(data) {
                    // console.log(data);
                    if(times[data] === track.length || (times[data] >= track.length - 1 && times[data] <= track.length + 1)) {
                        // console.log($(this).attr('href'));
                        link.url = $(this).attr('href');
                        link.status = true;
                        return false; //Break .each() loop.
                    }
                    else {
                        link.status = false;
                        link.reason = 'none found at length';
                    }
                })

                // console.log($(this).find('a.name').attr('href'))
                // link = $(this).find('a.name').attr('href')
                // link = 'http://newtabs.stream/kuWBZB:AnD3rB'
            })
        // await page.click(DOWNLOAD_BUTTON);
        }

        await download(link, track);

        await page.screenshot({ path: 'screenshots/'+ track.name + ' - ' + track.artist + '.png' });

        sBar.update((i+1));
    }
    sBar.close();

    sleep(5000);

    robj.playlist = playlist;
    await browser.close();
    return robj;
}

function logBadTracks(obj) {
    var wrongLength = [];
    var noneFound = [];
    for(i=0; i<obj.playlist.length; i++){
        if(obj.playlist.tracks[i].success === false) {
            if(obj.playlist.tracks[i].reason === 'none found at length'){
                wrongLength.push({name: obj.playlist.tracks[i].name + ' - ' + obj.playlist.tracks[i].artist, length: obj.playlist.tracks[i].length});
            } else if (obj.playlist.tracks[i].reason === 'none found'){
                noneFound.push(obj.playlist.tracks[i].name + ' - ' + obj.playlist.tracks[i].artist);
            }
        }
    }
    if(wrongLength.length > 0){
        console.log('\nThese tracks did not start because there was a length error:');
        // console.log(wrongLength);
        for(var i=0; i < wrongLength.length; i++) {
            console.log(`- ${color.red(wrongLength[i].name)}. Proper Length: ${color.green(wrongLength[i].length.toMinutes())}`)
        }
    } 
    if(noneFound.length > 0){
        console.log('\nThese tracks did not start because they were not found:');
        // console.log(noneFound);
        for(var i=0; i < noneFound.length; i++) {
            console.log(`- ${color.red(noneFound[i])}.`)
        }
    } 
    if(noneFound.length === 0 && wrongLength.length === 0) {
        console.log('\nAll tracks successfully started.');
    }
    console.log(color.green('\nFinishing up downloads.\n'));
}

function download(link, tr) {
    if(link.status !== false) {
        fetch(link.url).then(res => {
            var dest = fs.createWriteStream('./Songs/' + tr.name + ' - ' + tr.artist + '.mp3');
            res.body.pipe(dest);
        })
        // console.log(tr.name + ' - ' + tr.artist + ' successfuly started.');
    }
    else {
        tr.success = false;
        if(link.reason === 'none found at length'){
            tr.reason = link.reason;
            // console.error('Sorry, but the song ' + tr.name + ' - ' + tr.artist + ' with the specified length was not found.')
        }
        else if(link.reason === 'none found'){
            tr.reason = link.reason;
            // console.error('Sorry, but no songs were found for ' + tr.name + ' - ' + tr.artist);
        }
        // btr.push(tr);
    }
}

function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds){
        break;
        }
    }
}

run().then(function(res){
logBadTracks(res);
});
