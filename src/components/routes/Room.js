// need to use simple-peer (simplest solution)
// because WebRTC was designed for one-to-one connection
// Simple peer is a "wrapper" for webRTC
// MESH NETWORK: simplest way to build it, BUT not super scalable
//              bc everything piles up --> need a collection of peers
//              everyone is talking to
        // is this okay for us? We could make a room max?

// facilitates group video chat
import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import { Prompt } from "react-router-dom"
// styling component
import styled from "@emotion/styled";

// styling components
const Container = styled.div`
    padding: 20px;
    display: flex;
    height: 100vh;
    width: 90%;
    margin: auto;
    flex-wrap: wrap;
`;

const StyledVideo = styled.video`
    height: 50%;
    width: 50%;
`;

// takes a peer object 
const Video = (props) => {
    const ref = useRef(); // video reference to grab stream

    // takes the peer's stream
    useEffect(() => {
        props.peer.on("stream", stream => {
            ref.current.srcObject = stream;
        })
    }, []);

    return (
        <StyledVideo playsInline autoPlay ref={ref} />
    );
}

const videoConstraints = {
    height: window.innerHeight / 2,
    width: window.innerWidth / 2
};

const Room = (props) => {
    const [peers, setPeers] = useState([]);
    const socketRef = useRef();
    const userVideo = useRef();

    // an array of peers a collection of peers
    // match each individual peer object to a socket-ID
    // (was trying to do this before with a dictionary)
    // This will allow us to create handshales with each
    // individual peer
    // (When a person joins the room, the person will send out
    // there ID to everybody else and they with "Add the Peer"
    // and the person who joined will get a list of all the 
    // the people already in the room and then iterate through
    // their socket ID's)
    const peersRef = useRef([]);

    const roomID = props.match.params.roomID;

    // IN PROGRESS - disconnecting
    const [userDisconnects, setUserDisconnects] = useState(false)

    // join the room, only runs when you join the room for the FIRST TIME
    useEffect(() => {
        socketRef.current = io.connect("/");

        navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: true }).then(stream => {
            // make it so we can see our own video
            userVideo.current.srcObject = stream;
            // emit an event stating we have joined the room
            socketRef.current.emit("join room", roomID);

            // room at capacity
            // IN PROGRESS
            socketRef.current.on("room full", () => {
                console.log("room full");
                return (
                    // <Prompt message="Room is at capacity. Cannot add anymore users." />
                    <h1>Room is at capacity. Cannot add anymore users.</h1>
                );
            })

            // server emits back an event that gives all the 
            // users who are currently in the room
            // @params: an array of users
            socketRef.current.on("all users", users => {
                // *Remember this is the person who has just joined the room
                // and needs to connect with everybody else in the room*
                const peers = [];
                users.forEach(userID => {
                    // for each userID we are creating a newPeer (check function)
                    // send the userID, our own id and our own stream
                    const peer = createPeer(userID, socketRef.current.id, stream);
                    peersRef.current.push({
                        peerID: userID, // socketID for other participant
                        peer, // actual peer object
                    })
                    // actually passing the object to the peers array
                    // this will end up being our state
                    peers.push(peer); 
                })
                setPeers(peers);
            })

            // from perspective of a person already in the room and a new user joins
            // get a payload object from the server
            socketRef.current.on("user joined", payload => {
                const item = peersRef.current.find(p => p.peerID === payload.callerID);
                if(!item) {
                    // signal, who is calling us, our own stream
                    const peer = addPeer(payload.signal, payload.callerID, stream);
                    // push the new peer into the users peer reference array
                    peersRef.current.push({
                        peerID: payload.callerID,
                        peer,
                    })

                    // adjusting the peer array state by adding the new peer
                    // note the '...' syntax means 'take what's already in the array and add onto it'
                    setPeers(users => [...users, peer]);
                }
            });

            // recieving a RETURN signal, from the perspective of the newcomer
            socketRef.current.on("receiving returned signal", payload => {
                // need to actually find the person from whom you are recieving the signal
                // traverse through the peerRef array to find matching callerID
                const item = peersRef.current.find(p => p.peerID === payload.id);
                // item = the peer reference object, then item.peer actually grabs the peer
                // actually accepting the signal from the sender, establishes a direction connection
                // completes the "handshake"
                item.peer.signal(payload.signal);
            });

            // IN PROGRESSS
            window.addEventListener("beforeunload", function (event) {
                setUserDisconnects(true)
                socketRef.current.emit("disconnect");
                // event.returnValue = "Hellooww"
            })

        })

    }, [userDisconnects]);

    //@params: the Id of the person they are calling, their caller ID, and their stream
    function createPeer(userToSignal, callerID, stream) {
        const peer = new Peer({
            initiator: true, // immediately on construction the signal is sent out
                            // the person joining the room needs to tell everybody else
                            // that they joined the room to create the "handshake"
            trickle: false,
            stream,
        });

        // capture signal event from setting 'initiator: true'
        peer.on("signal", signal => {
            socketRef.current.emit("sending signal", { userToSignal, callerID, signal })
        })

        return peer;
    }

    // incoming signal = signal sent from the person who just joined the room
    function addPeer(incomingSignal, callerID, stream) {
        const peer = new Peer({
            initiator: false, // not sending out a signal
            trickle: false,
            stream,
        })

        // signal event actually fired when this peer is recieving
        // an offer from someone who wants to connect to them
        // (recieving signal)
        peer.on("signal", signal => {
            // return a signal by sending signal and the person who called us
            socketRef.current.emit("returning signal", { signal, callerID })
        })

        // accept incoming signal --> triggers the event above --> 
        // causing a signal to be returned to caller
        peer.signal(incomingSignal);

        return peer;
    }

    return (
        <Container>
            <StyledVideo muted ref={userVideo} autoPlay playsInline />
            {peers.map((peer, index) => {
                return (
                    // reference Video above to understand how this works! :)
                    <Video key={index} peer={peer} />
                );
            })}
        </Container>
    );
};

export default Room;