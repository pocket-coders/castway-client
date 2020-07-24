// facilitates handshake
require('dotenv').config();
const express = require("express");
const http = require("http");
const socket = require("socket.io");

// CONSTANTS
const HEARTBEAT_TIMEOUT = 4000 // 4s
const HEARTBEAT_INTERVAL = 60000 // 1m
const ROOM_LIMIT = 4;

// SERVER OBJECTS
const app = express();
const server = http.createServer(app);
const io = socket(server, {'pingInterval': HEARTBEAT_INTERVAL, 'pingTimeout': HEARTBEAT_TIMEOUT});

const ROOM_LIMIT = 5;
const users = {}; 
// dict[socket ID] = room ID;
const socketToRoom = {};

// SOCKET BEHAVIOR
io.set('heartbeat timeout', HEARTBEAT_TIMEOUT);
io.set('heartbeat interval', HEARTBEAT_INTERVAL);

// for chat msg
io.on('connection', socket => {
    socket.on('message', ({ name, message }) => {
      io.emit('message', { name, message })
    })
})

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
        let room = users[roomID];
        if (room) {
            room = room.filter(id => id !== socket.id);
            users[roomID] = room;
        } else {
            console.log("Room closed: " + roomID)
        }
    });
});

server.listen(process.env.PORT || 8000, () => console.log('server is running on port 8000'));