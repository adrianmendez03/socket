require('dotenv').config
const app = require('express')()
const http = require('http').Server(app)
const io = require('socket.io')(http, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
})
const PORT = process.env.PORT || 4500

let clients = {}

app.get('/', (req, res) => {
    res.send('hello')
})

io.on('connection', socket => {
    console.log(`User: ${socket.id}, has connected`)

    socket.on('saveUser', userId => {
        clients[userId] = socket.id 
        console.log('Clients: ', clients)
        io.emit('newUser', clients)
    })

    socket.on('joinRoom', roomId => {
        socket.join(roomId)
        console.log(`User: ${socket.id}, has joined Room: ${roomId}`)
        socket.on('message', ({ user, content }) => {
            io.to(roomId).emit('message', { user, content })
        })
    })

    socket.on('leaveRoom', roomId => {
        socket.leave(roomId)
        console.log(`User: ${socket.id}, has left Room: ${roomId}`)
    })

    socket.on('notification', userId => {
        console.log(`Sending notification to ${userId}`)
        if (clients[userId]) {
            io.to(clients[userId]).emit('refresh')
        }
    })

    socket.on('disconnect', () => {
        for (let key in clients) {
            if (clients[key] === socket.id) {
                delete clients[key]
                break
            }
        }
        io.emit('userLeft', clients)
        console.log(`User: ${socket.id}, has disconnected`)
        console.log('Clients: ', clients)
    })
})

http.listen(PORT, () => {
    console.log('Listening on port: 4000')
})