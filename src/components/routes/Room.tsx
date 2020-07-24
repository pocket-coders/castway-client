// need to use simple-peer (simplest solution)
// because WebRTC was designed for one-to-one connection
// Simple peer is a "wrapper" for webRTC
// MESH NETWORK: simplest way to build it, BUT not super scalable
//              bc everything piles up --> need a collection of peers
//              everyone is talking to
        // is this okay for us? We could make a room max?

// facilitates group video chat
import React, { useEffect, useRef, useState, RefObject } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
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
const Video = (props: any) => {
    const ref = useRef() as RefObject<HTMLVideoElement>; // video reference to grab stream

    // takes the peer's stream
    useEffect(() => {
        props.peer.on("stream", (stream: MediaStream | MediaSource | Blob | null) => {
            (ref as any).current.srcObject = stream;
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

interface NewPeer {
    peerID: string;
    peer: RTCPeerConnection;
}

const Room = (props: any) => {
    const [peers, setPeers] = useState([]) as any;
    const socketRef = useRef() as any;
    const userVideo = useRef() as any;
    const [userDisconnects, setUserDisconnects] = useState(false)
    // an array of peers a collection of peers
    // match each individual peer object to a socket-ID
    const peersRef = useRef([]) as any;
    // id for the given room
    const roomID = props.match.params.roomID;

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
            socketRef.current.on("all users", (users: any) => {
                // *Remember this is the person who has just joined the room
                // and needs to connect with everybody else in the room*
                const peersList: [NewPeer] = [{'peerID': "0", peer: new RTCPeerConnection}];
                users.forEach((user: any, ind: number) => {
                    if (ind==0) {
                        peersList.pop();
                    }
                    // for each userID we are creating a newPeer (check function)
                    // send the userID, our own id and our own stream
                    let userID = user.id;
                    let newPeer = {
                        peerID: userID,
                        peer: createPeer(userID, false ),
                    }

                    peersRef.current.push(newPeer)
                    // actually passing the object to the peers array
                    // this will end up being our state
                    peersList.push(newPeer); 
                })
                setPeers(peersList);

            });

            // from perspective of a person already in the room and a new user joins
            // get a payload object from the server
            socketRef.current.on("user joined", (payload: any) => {
                const item = peersRef.current.find((p: any) => p.peerID === payload.callerID);
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
                    setPeers((users:any) => [...users, peer]);
                }
            });

            // recieving a RETURN signal, from the perspective of the newcomer
            socketRef.current.on("receiving returned signal", (payload: any) => {
                // need to actually find the person from whom you are recieving the signal
                // traverse through the peerRef array to find matching callerID
                const item = peersRef.current.find((p: any) => p.peerID === payload.id);
                // item = the peer reference object, then item.peer actually grabs the peer
                // actually accepting the signal from the sender, establishes a direction connection
                // completes the "handshake"
                item.peer.signal(payload.signal);
            });

            // IN PROGRESSS
            window.addEventListener("beforeunload", function () {
                setUserDisconnects(true)
                // socketRef.current.emit("disconnect");
                // event.returnValue = "Hellooww"
            })

        })

    }, [userDisconnects]);

    // Build a webrtc peer object 
    function createPeer(userID: string, init: boolean) {
        /*
            @params
            userID: string - socketID reference to associate the peer with
            init: bool - was this person the call initiator

            @description
            Peer object constructor.  Also add this object to local peer master reference
        */

        const peer = new RTCPeerConnection({
            // STUN protocol
            iceServers: [
                {
                    urls: "stun:stun.stunprotocol.org"
                },
                {
                    urls: 'turn:numb.viagenie.ca',
                    credential: 'muazkh',
                    username: 'webrtc@live.com'
                },
            ]
        });

        // capture signal event from setting 'initiator: true'
        peer.on("signal", (signal: any) => {
            socketRef.current.emit("sending signal", { userToSignal, userID, signal, init })
        })

        return peer;
    }

    // incoming signal = signal sent from the person who just joined the room
    function addPeer(incomingSignal: any, callerID: string, stream: MediaStream | undefined) {
        const peer = new Peer({
            initiator: false, // not sending out a signal
            trickle: false,
            stream,
        })
    
        return peer
    }
    
    function handleNegotiationNeededEvent(userID: string) {
        /*
            @params
            userID: int - userID of user we need to negotiate with

            @description
            Callback for peers that need signalling to resolve call event
        */

        // returns a promise and resolve with offer object
        // take offer and set as remote description
        peersRef.current[userID].createOffer().then((offer: any) => {
            return peersRef.current[userID].setLocalDescription(offer);
        }).then(() => {
            const payload = {
                target: userID, // your id
                caller: socketRef.current.id,
                sdp: peersRef.current[userID].localDescription // offer data
            };
            socketRef.current.emit("offer", payload);
        }).catch((e: Error) => console.log(e));
    }

    function handleRecieveCall(payload: any) {
        /*
            @params
            payload:
                caller: any - object of the caller we're receiving from
                sdp: any - handshake information

            Callback for receiving an offer from peer
        */

        peersRef.current[payload.caller.id] = createPeer(payload.caller.id, false); // not initiating call
        // description object --> remote
        const desc = new RTCSessionDescription(payload.sdp);
        peersRef.current[payload.caller.id].setRemoteDescription(desc).then(() => {
            // attach streams
            userStream.current.getTracks().forEach((track: MediaStreamTrack) => peersRef.current[payload.caller.id].addTrack(track, userStream.current));
        }).then(() => {
            return peersRef.current[payload.caller.id].createAnswer();
        }).then((answer: any) => {
            return peersRef.current.setLocalDescription(answer);
        }).then(() => {
            // send data back to the caller
            const newPayload = {
                target: payload.caller,
                caller: socketRef.current.id,
                sdp: peersRef.current.localDescription
            }
            socketRef.current.emit("answer", newPayload);
        })

        // signal event actually fired when this peer is recieving
        // an offer from someone who wants to connect to them
        // (recieving signal)
        peer.on("signal", (signal: any) => {
            // return a signal by sending signal and the person who called us
            socketRef.current.emit("returning signal", { 'signal': signal, 'userID': payload.caller.id })
        })

        // accept incoming signal --> triggers the event above --> 
        // causing a signal to be returned to caller
        peer.signal(incomingSignal);

        return peer;
    }

    return (
        <Container>
            <StyledVideo muted ref={userVideo} autoPlay playsInline />
            {peers.map((peer: any, index: string) => {
                return (
                    // reference Video above to understand how this works! :)
                    <Video key={index} peer={peer} />
                );
            })}
        </Container>
    );
};

export default Room;