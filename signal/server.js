// facilitates handshake
const express = require("express");
const http = require("http");
const socket = require("socket.io");
const cors = require("cors");
const app = express();
const server = http.createServer(app);

// set socketio with cors
const io = socket(server, {path:"/", origins: '*:*', 
    handlePreflightRequest: (req, res) => {
        const headers = {
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Origin": "https://castway.app",
            "Access-Control-Allow-Credentials": true
        };
        res.writeHead(200, headers);
        res.end();
    }}
);

// HARD CONSTANTS
const ROOM_LIMIT = 4;
const PORT = process.env.PORT || 8000

// MASTER LISTS
const users = {}; 
const socketToRoom = {};

var corsOptions = {
    origin: 'https://castway.app',
    // legacy browsers dont like 204
    optionsSuccessStatus: 200,
}

app.use(cors(corsOptions))

// socket signalling server
io.on('connection', socket => {

    socket.on("join room", roomID => {
        if (users[roomID]) {
            const length = users[roomID].length;
            // max number of people in a room
            // add person to the room, or say it is full
            // or create a new room
            if (length === ROOM_LIMIT) {
                socket.emit("room full");
                return;
            }
            users[roomID].push(socket.id);
        } else {
            users[roomID] = [socket.id];
        }
        socketToRoom[socket.id] = roomID;
        // get all user socket ID's 
        const usersInThisRoom = users[roomID].filter(id => id !== socket.id);

        socket.emit("all users", usersInThisRoom);
    });

    socket.on("sending signal", payload => {
        io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID });
    });

    socket.on("returning signal", payload => {
        io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id });
    });

    socket.on('disconnect', () => {
        const roomID = socketToRoom[socket.id];
        const room = users[roomID];
        // emit to all relevant users to disconnect from lost peer
        room.forEach(user => { io.to(user).emit('user-disconnect', {id: socket.id}) })
    });

    // disconnect users that 
    socket.on('error', payload => {
        const roomID = socketToRoom[socket.id];
        const room = users[roomID];
        // emit to all relevant users to disconnect from lost peer
        room.forEach(user => { io.to(user).emit('user-disconnect', {id: socket.id}) })
    });
});

server.listen(PORT, () => console.log('server is running on port 8000'));