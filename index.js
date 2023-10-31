import _ from "lodash";

import express from "express"
import http from "http"
import { Server } from "socket.io";

import fetch from "node-fetch";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*'
    }
});

app.get('/', (req, res) => {
  res.send('eyo')
});

app.use(express.static('frontends'));


io.on('connection', (socket) => {

  console.log('a user connected');
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
    gameState.buzzers[0].lastPressed = null
    gameState.buzzers[1].lastPressed = null
    sendGamestate()
  })

  socket.on('closeBuzzers', (msg) => {
    gameState.buzzersOpen = false
    sendGamestate()
  })

  socket.on('rightAnswer', async (msg) => {
    console.log('rightanswer play');
    io.sockets.emit('playSound', 'right')
    //await fetch('http://192.168.11.169:8000/press/bank/99/3')

  })

  socket.on('wrongAnswer', async (msg) => {
    io.sockets.emit('playSound', 'wrong')
    //await fetch('http://192.168.11.169:8000/press/bank/99/4')

  })

  socket.on('flipUsed', (msg) => {
    let i = msg - 1
    gameState.categories[Math.floor(i/5)].questions[i%5].used = !gameState.categories[Math.floor(i/5)].questions[i%5].used
    sendGamestate()
  })

  socket.on('buzz', async (msg) => {
    if (gameState.buzzersOpen) {
        console.log('a')
        io.sockets.emit('playSound', 'buzzer')
        io.sockets.emit('showBuzz', {id: msg})
        
        //await fetch('http://192.168.11.169:8000/press/bank/99/2')


        gameState.buzzers[msg].lastPressed = new Date()
        gameState.buzzersOpen = false
    } else {
        if ((gameState.buzzers[(msg == 0) ? 1 : 0].lastPressed != null) && (gameState.buzzers[msg].lastPressed == null)) {
            // late buzz
            gameState.buzzers[msg].lastPressed = new Date()
            console.log('late buzz')
            let diff = gameState.buzzers[msg].lastPressed - gameState.buzzers[(msg == 0) ? 1 : 0].lastPressed
            if (diff < 5000) {
                io.sockets.emit('lateBuzz', {
                    'id': msg,
                    'diff': diff
                })
            }
        }
    }
    sendGamestate()
  })

  socket.onAny((e, p) => {
    console.log(e,JSON.stringify(p))
  })
});

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
            name: 'C-BAS',
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
        }
    ]
}

function sendGamestate() {
    io.sockets.emit('gamestate', gameState)
}