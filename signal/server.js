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
            "Access-Control-Allow-Origin": req.headers.origin, //or the specific origin you want to give access to,
            "Access-Control-Allow-Credentials": true
        };
        res.writeHead(200, headers);
        res.end();
    }});

const ROOM_LIMIT = 4;
const users = {}; 

// dictionary of sockets and ID's
// dict[socket ID] = room ID;
const socketToRoom = {};

var corsOptions = {
    origin: 'https://castway.app',
    // legacy browsers dont like 204
    optionsSuccessStatus: 200,
}

app.use(cors(corsOptions))

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
        console.log("disconnecting")
        const roomID = socketToRoom[socket.id];
        let room = users[roomID];
        if (room) {
            room = room.filter(id => id !== socket.id);
            users[roomID] = room;
            socket.to(roomID).emit("disconnected", {"userID": socket.id})
        }
    });

});

server.listen(process.env.PORT || 8000, () => console.log('server is running on port 8000'));