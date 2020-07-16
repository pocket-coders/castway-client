// SERVER-SIDE

// imports
const express = require("express");
const http = require("http");
// app object
const app = express();
// create new server
const server = http.createServer(app);
const socket = require("socket.io");
// instance of io
const io = socket(server);

// rooms collection
var rooms = {};

// when connection occurs
io.on("connection", socket => {
    // attach an event listener
    // pull roomID out of the URL and send to server
    // if room exists --> take socket id (new socket) and add it
    // else create a new room object
    socket.on("join room", roomID => {
        if (rooms[roomID]) {
            rooms[roomID].push(socket.id);
        } else {
            rooms[roomID] = [socket.id];
        }
        // find the other user, check to see if someone is already
        // in the room 
        // .find --> is there an ID that is not my own 
        // Find and GET other id's
        rooms[roomID].forEach(user = () => {
            if (user !== socket.id) {
                // emit event back
                socket.emit("other user", user),
                // emit to other user that someone has joined
                // create the "handshake"
                socket.to(user).emit("user joined", socket.id);
            }
        }) 
    });

    socket.on("offer", payload => {
        // send an event to the target (socket id)
        // payload includes: (1) who you are as the caller or id and (2) offer 'object'
        io.to(payload.target).emit("offer", payload);
    });

    socket.on("answer", payload => {
        // recieved the offer, answer sent back to orginal peer calling
        io.to(payload.target).emit("answer", payload);
    });

    // Attempting connection --> firewalls, ip address connection, etc
    // ice-servers i.e. stunt servers, an ice canidate allows for a pair
    // to agree on a proper connection
    // This event is used by both peers, back and forth until they make
    // a "handshake"
    socket.on("ice-candidate", incoming => {
        io.to(incoming.target).emit("ice-candidate", incoming.candidate);
    });

    // on disconnect
    socket.on('disconnecting', () => {
        // rooms associated with socket
        const curr_rooms = Object.keys(socket.rooms);

        for (const roomID in curr_rooms) {
            // tell all rooms associated with client that they disconnected
            io.to(roomID).emit({"disconnected": socket.id})
            // remove socket from room in master rooms list, if room still exists
            if (rooms[roomID]) {
                var ind = rooms[roomID].indexOf(socket.id);
                rooms[roomID].splice(ind, 1);
            }
        }
    })
});

server.listen(8000, () => console.log('server is running on port 8000'));