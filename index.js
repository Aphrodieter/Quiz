import _ from "lodash";

import express from "express"
import http from "http"
import { Server } from "socket.io";

import fetch from "node-fetch";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('frontends'));


io.on('connection', (socket) => {

  console.log(`${socket.id} connected`);

  socket.on('disconnect', (error) => {
    console.log(`${socket.id} disconnected with error: ${error}`);
  });

  sendGamestate()

  socket.on('setData', (msg) => {
    try {
        _.set(gameState, msg.key, msg.value)
        sendGamestate()
    } catch (error) {
        console.error(error)
    }
  })

  socket.on('pickQuestion', (msg) => {
    let cat = Math.floor((msg-1) / 5)
    let qindex = ((msg-1) % 5)
    io.sockets.emit('showQuestion', gameState.categories[cat].questions[qindex])
    gameState.categories[cat].questions[qindex].used = true
    sendGamestate()
  })

  socket.on('hideQuestion', (msg) => {
    io.sockets.emit('hideQuestion')
  })

  socket.on('changePoints', (msg) => {
    gameState.players[msg.id].score += msg.amount
    io.sockets.emit('playSound', (msg.amount > 0) ? 'pointsGiven' : 'pointsDeducted')
    sendGamestate()
  })

  socket.on('openBuzzers', (msg) => {
    gameState.buzzersOpen = true
    gameState.buzzers.forEach((buzzer, index) => {
        gameState.buzzers[index].lastPressed = null;
    });

    sendGamestate()
  })

  socket.on('closeBuzzers', (msg) => {
    gameState.buzzersOpen = false
    sendGamestate()
  })

  socket.on('rightAnswer', async (msg) => {
    console.log('rightanswer play');
    io.sockets.emit('playSound', 'right')
    /* try {
        await fetch('http://192.168.11.169:8000/press/bank/99/3')
    }
    catch (error){
        console.log('ERROR TRIGGERING LIGHT: Graphics Computer not running Companion');
    } */
  })

  socket.on('wrongAnswer', async (msg) => {
    io.sockets.emit('playSound', 'wrong')
   /*  try {
        await fetch('http://192.168.11.169:8000/press/bank/99/4')
    }
    catch (error){
        console.log('ERROR TRIGGERING LIGHT: Graphics Computer not running Companion');
    } */
  })

  socket.on('flipUsed', (msg) => {
    let i = msg - 1
    gameState.categories[Math.floor(i/5)].questions[i%5].used = !gameState.categories[Math.floor(i/5)].questions[i%5].used
    sendGamestate()
  })

  function delay(milliseconds){
    return new Promise((resolve) => {
        setTimeout(resolve, milliseconds);
    });
    }

  socket.on('buzz', async (buzzer) => {

    //delay studio buzzers
    io.sockets.emit('playSound', 'buzzer')

    if (buzzer == 0 || buzzer == 1){
        await delay(200)
     }

    if (gameState.buzzersOpen) {
        io.sockets.emit('playSound', 'timer')
        io.sockets.emit('showBuzz', {id: buzzer})
        
       /*  try {
            await fetch('http://192.168.11.169:8000/press/bank/99/2')
        }
        catch (error){
            console.log('ERROR TRIGGERING LIGHT: Graphics Computer not running Companion');
        } */
        

        //remote Buzzer
        if (buzzer == 2 || buzzer == 3){
            io.sockets.emit('changeButtonToPressed')
        }

        gameState.buzzers[buzzer].lastPressed = new Date()
        gameState.buzzersOpen = false
    } else {
        if (SomeBuzzerWasQuicker() && notBuzzedYet(buzzer)) {
            // late buzz
            gameState.buzzers[buzzer].lastPressed = new Date()
            console.log('late buzz')
            let diff = gameState.buzzers[buzzer].lastPressed - quickestBuzzer()
            if (diff < 5000) { // under 5 seconds

                io.sockets.emit('lateBuzz', {
                    'id': buzzer,
                    'diff': diff
                })

                //remote Buzzer
                if (buzzer == 2 || buzzer == 3){
                    io.sockets.emit('changeButtonToPressed')
                }
            }
        }
    }
    sendGamestate()
  })

  socket.onAny((e, p) => {
    console.log(e,JSON.stringify(p))
  })
});

function SomeBuzzerWasQuicker() {
    return gameState.buzzers.some(buzzer => {
        return buzzer.lastPressed != null});
}

function notBuzzedYet(buzzer) {
    return gameState.buzzers[buzzer].lastPressed == null;
}

function quickestBuzzer() {
    let dates = gameState.buzzers.map(buzzer => buzzer.lastPressed).filter(date =>{
        return date != null;
    });

    console.log(dates);
    let x = new Date(Math.min.apply(null, dates));
    console.log(x);
    return x
}

server.listen(3000, () => {
  console.log('listening on *:3000');
});



var gameState = {
    players: [
        {
            name: 'Fabrice',
            score: 0
        },
        {
            name: 'Soundso',
            score: 0
        },
        {
            name: 'Clemens',
            score: 0
        },
        {
            name: 'Conny',
            score: 0
        }
    ],
    categories: [
        {
            name: 'Welcome to Playoffs',
            catid: 0,
            questions: [
                {
                    value: 100,
                    text: 'Nenne alle Serienergebnisse der bisherigen Playoffs',
                    used: false
                },
                {
                    value: 200,
                    text: 'Was passiert als nächstes?',
                    used: false
                },
                {
                    value: 300,
                    text: 'Mit wie vielen Punkten Unterschied hat Ulm das erste Viertelfinalspiel gewonnen?',
                    used: false
                },
                {
                    value: 600,
                    text: 'In welcher Saison erreichte Bonn zum letzten Mal die Playoffs, bevor Iisalo Headcoach wurde?',
                    used: false
                },
                {
                    value: 1000,
                    text: 'Wie oft standen sich zwei Teams ohne Meistertitel schon in einer BBL Finalserie gegenüber?',
                    used: false
                }
            ]
        },
        {
            name: 'Around the world',
            catid: 1,
            questions: [
                {
                    value: 100,
                    text: 'Wer ist aktueller EuroCup Champion?',
                    used: false
                },
                {
                    value: 200,
                    text: 'In welchem Jahr gewann Tibor Pleiß zum ersten Mal die EuroLeague?',
                    used: false
                },
                {
                    value: 300,
                    text: 'Nenne die WM Gruppe von Deutschland bei der WM 2023',
                    used: false
                },
                {
                    value: 600,
                    text: 'Wer ist das?',
                    used: false
                },
                {
                    value: 1000,
                    text: 'Bei wie vielen NBA Teams hat Bruno Caboclo gespielt? ',
                    used: false
                }
            ]
        },
        {
            name: 'All eyes on..',
            catid: 2,
            questions: [
                {
                    value: 100,
                    text: 'Wer wurde Finals MVP der Saison 2021/22?',
                    used: false
                },
                {
                    value: 200,
                    text: 'Seit welcher Saison spielt TJ Shorts II in der easyCredit BBL?',
                    used: false
                },
                {
                    value: 300,
                    text: 'Welcher Spieler ist das?',
                    used: false
                },
                {
                    value: 600,
                    text: 'Was passiert als nächstes?',
                    used: false
                },
                {
                    value: 1000,
                    text: 'Wie oft wurde Karsten Tadda Deutscher Meister?',
                    used: false
                }
            ]
        },
        {
            name: 'Numbers Game',
            catid: 3,
            questions: [
                {
                    value: 100,
                    text: 'Welcher Spieler hatte in der Hauptrunde dieser Saison im Durchschnitt den höchsten Effektivitätswert?',
                    used: false
                },
                {
                    value: 200,
                    text: 'Welcher Spieler holte in der Hauptrunde dieser Saison in Summe die meisten Rebounds?',
                    used: false
                },
                {
                    value: 300,
                    text: 'Wer ist Topscorer der bisherigen Playoffs?',
                    used: false
                },
                {
                    value: 600,
                    text: 'Wie oft wurde ALBA BERLIN Deutscher Meister?',
                    used: false
                },
                {
                    value: 1000,
                    text: 'Wie viele Spieler aus beiden Kadern haben mit Anton Gavel in dessen aktiver Karriere zusammengespielt?',
                    used: false
                }
            ]
        },
        {
            name: 'Homecourt Advantage',
            catid: 4,
            questions: [
                {
                    value: 100,
                    text: 'Zu welchem Team gehört dieses Maskottchen?',
                    used: false
                },
                {
                    value: 200,
                    text: 'Wie viele Siege hat Bonn in dieser Saison in allen Wettbewerben zuhause geholt?',
                    used: false
                },
                {
                    value: 300,
                    text: 'In welcher Stadt steht diese Halle?',
                    used: false
                },
                {
                    value: 600,
                    text: 'Wie oft war ein Team vor dieser Saison seit 98/99 in einer kompletten Hauptrunde zu Hause ungeschlagen?',
                    used: false
                },
                {
                    value: 1000,
                    text: 'Wie oft wurde der Hauptundenmeister auch Deutscher Meister (seit 1998/1999)?',
                    used: false
                }
            ]
        }
    ],
    buzzersOpen: true,
    buzzers: [
        {
            lastPressed: null
        },
        {
            lastPressed: null
        },
        {
            lastPressed: null
        },
        {
            lastPressed: null
        }
    ]
}

function sendGamestate() {
    io.sockets.emit('gamestate', gameState)
}