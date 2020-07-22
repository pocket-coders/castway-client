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
// styling component
import "./styles.css"

const Video = (props) => {
    const ref = useRef();

    useEffect(() => {
        props.peer.on("stream", stream => {
            ref.current.srcObject = stream;
        })
    }, []);

    return (
        <div id="peer-video-container">
            <video controls id="peer-video" playsInline autoPlay ref={ref} />
            <p id="username">Username</p>
        </div>    
    );
}

const Room = (props) => {
    const [peers, setPeers] = useState([]);
    const socketRef = useRef();
    const userVideo = useRef();
    const peersRef = useRef([]);

    // for screenshare
    const userStream = useRef();

    const roomID = props.match.params.roomID;

    useEffect(() => {
        socketRef.current = io.connect("/");

        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
            userVideo.current.srcObject = stream;

            // for sharescreen
            userStream.current = stream;
        
            socketRef.current.emit("join room", roomID);

            socketRef.current.on("all users", users => {
                const peers = [];
                users.forEach(userID => {
                    const peer = createPeer(userID, socketRef.current.id, stream);
                    peersRef.current.push({
                        peerID: userID, 
                        peer,
                    })
                    peers.push(peer); 
                })
                setPeers(peers);
            })

            socketRef.current.on("user joined", payload => {
                const item = peersRef.current.find(p => p.peerID === payload.callerID);
                if(!item) {
                    const peer = addPeer(payload.signal, payload.callerID, stream);
                    peersRef.current.push({
                        peerID: payload.callerID,
                        peer,
                    })

                    setPeers(users => [...users, peer]);
                }
            });

            socketRef.current.on("receiving returned signal", payload => {
                const item = peersRef.current.find(p => p.peerID === payload.id);
                item.peer.signal(payload.signal);
            });
        })

    }, []);

    //@params: the Id of the person they are calling, their caller ID, and their stream
    function createPeer(userToSignal, callerID, stream) {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
        });

        peer.on("signal", signal => {
            socketRef.current.emit("sending signal", { userToSignal, callerID, signal })
        })

        return peer;
    }

    function addPeer(incomingSignal, callerID, stream) {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream,
        })

        peer.on("signal", signal => {
            socketRef.current.emit("returning signal", { signal, callerID })
        })

        peer.signal(incomingSignal);

        return peer;
    }

    // CONVERT TO TYPESCRIPT
    function shareScreen() {
        navigator.mediaDevices.getDisplayMedia({ cursor: true }).then(stream => {
            // get video of screen
            const screenTrack = stream.getTracks()[0];
            userVideo.current.srcObject = stream;
            // on screenshare
            peersRef.current.forEach((p) => {
                p.peer._pc.getSenders().find(sender => sender.track.kind === "video").replaceTrack(screenTrack);
            })
            // end screenshare
            screenTrack.onended = function() {
                peersRef.current.forEach((p) => {
                    p.peer._pc.getSenders().find(sender => sender.track.kind === "video").replaceTrack(userStream.current.getTracks()[1]);
                })
                userVideo.current.srcObject = userStream.current;
            }
        })
    }

    return (
        // wrapping tag
        <body>
            <div id="user-header">
                <div id="meeting">
                    <h2>Castway Meeting Room</h2>
                    <button onClick={shareScreen}>Share screen</button>
                </div>
                <div id="user-video-container">
                    <video controls id="user-video" muted ref={userVideo} autoPlay playsInline/>
                </div>
            </div>
            <div id="peer-container">
                {peers.map((peer, index) => {
                    return (
                        <Video key={index} peer={peer} />
                    );
                })}
            </div>
        </body>
    );
};

export default Room;