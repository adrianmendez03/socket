require("dotenv").config
const app = require("express")()
const http = require("http").Server(app)
const io = require("socket.io")(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
})
const PORT = process.env.PORT || 4500

// DICTIONARY TO ASSOSCIATE SOCKET IDS WITH USER IDS
// USING A DICTIONARY BECAUSE IT'S FASTER TO LOOK FOR ENTRIES
let clients = {}

app.get("/", (req, res) => {
  res.send("hello")
})

io.on("connection", (socket) => {
  console.log(`User: ${socket.id}, has connected`)

  // WHEN USER SIGNS IN THE CLIENT SOCKET EMITS 'saveUser' WITH THE USER ID
  // THIS EVENT LISTENER ADDS THE USERID KEY WITH SOCKETID VALUE TO THE CLIENTS DICTIONARY
  socket.on("saveUser", (userId) => {
    clients[userId] = socket.id
    console.log("Clients: ", clients)
    io.emit("newUser", clients)
  })

  // ADDS A SOCKET TO A ROOM
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId)
    console.log(`User: ${socket.id}, has joined Room: ${roomId}`)
    socket.on("message", ({ user, content }) => {
      io.to(roomId).emit("message", { user, content })
    })
  })

  // REMOVES SOCKET FROM ROOM
  socket.on("leaveRoom", (roomId) => {
    socket.leave(roomId)
    console.log(`User: ${socket.id}, has left Room: ${roomId}`)
  })

  // EMITS A NOTIFICATION TO A USER IF THEY ARE FOUND IN THE CLIENTS DICTIONARY
  socket.on("notification", (userId) => {
    console.log(`Sending notification to ${userId}`)
    if (clients[userId]) {
      io.to(clients[userId]).emit("refresh")
    }
  })

  socket.on("isOnline", (userId, personId) => {
    console.log(`User: ${userId} is asking if Person: ${personId} is online.`)
    if (clients[personId]) {
      console.log("Yes they are.")
      io.to(clients[userId]).emit("yes")
    } else {
      console.log("No they are not.")
      io.to(clients[userId]).emit("no")
    }
  })

  // LOOPS THROUGH THE CLIENTS KEYS AND REMOVES THE DISCONNECTING SOCKET
  socket.on("disconnect", () => {
    for (let key in clients) {
      if (clients[key] === socket.id) {
        delete clients[key]
        break
      }
    }
    io.emit("userLeft", clients)
    console.log(`User: ${socket.id}, has disconnected`)
    console.log("Clients: ", clients)
  })
})

http.listen(PORT, () => {
  console.log("Listening on port: 4000")
})
