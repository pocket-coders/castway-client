// Video-chat logic

import React, { useRef, useEffect, useState } from "react";
import io from "socket.io-client";
import './styles.css'
  
const Room = (props) => {
    // references
    // const peers = useState([]);
    const userVideo = useRef();
    const socketRef = useRef();
    const peersRef = useRef([]);
    const userStream = useRef();
 
    useEffect(() => {
        // ask browser for user access to video and audio
        // Promise resolves --> returns user's stream
        navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(stream => {
            // allows us to display the actual video
            userVideo.current.srcObject = stream;
            userStream.current = stream;

            // connect to socket server
            socketRef.current = io.connect("/");
            // emit event to the server
            // props.match.params.roomID --> pulls the ID out of the URL
            socketRef.current.emit("join room", props.match.params.roomID);

            // fires depending on another user present
            socketRef.current.on('other user', userID => {
                if (userID !== socketRef.id) {
                    callUser(userID);
                }
            });

            socketRef.current.on("user joined", payload => {
                // call user and push to peers ref
                if (payload.userID !== socketRef.id) {
                    const peer = createPeer(payload.userID, false)
                    peersRef.current.push({
                        peerID: payload.userID,
                        peer,
                    });
                }
                
            });

            socketRef.current.on("offer", handleRecieveCall);

            socketRef.current.on("answer", handleAnswer);

            socketRef.current.on("ice-candidate", handleNewICECandidateMsg);
        });

    }, []);

    
    function callUser(userID) {
        /*
            @params
            userID: int - socketID reference to call

            Create autonomous peer object using constructor
        */
        console.log(peersRef, userID);
        const peer = createPeer(userID, true)
        peersRef.current[userID] = peer; 

        // go to our stream, get all the "tracks" which are the tracks we called earlier (audio and video)
        // then attach peer stream to our stream
        // give peer access to our stream
        userStream.current.getTracks().forEach(track => peersRef[userID].current.addTrack(track, userStream.current));
    }

    // Build a webrtc peer object 
    function createPeer(userID, init) {
        /*
            @params
            userID: int - socketID reference to associate the peer with
            init: bool - was this person the call initiator

            @description
            Peer object constructor.  Also add this object to local peer master reference
        */

        const peer = new RTCPeerConnection({
            initiator: init, 
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

        peer.onicecandidate = handleICECandidateEvent;
        // recieving a remote peer (sending us their stream)
        peer.ontrack = handleTrackEvent;
        // initiate call, offer created ... 
        peer.onnegotiationneeded = () => handleNegotiationNeededEvent(userID);

        return peer;
    }

    function handleNegotiationNeededEvent(userID) {
        /*
            @params
            userID: int - userID of user we need to negotiate with

            @description
            Callback for peers that need signalling to resolve call event
        */

        // returns a promise and resolve with offer object
        // take offer and set as remote description
        peersRef.current[userID].createOffer().then(offer => {
            return peersRef.current[userID].setLocalDescription(offer);
        }).then(() => {
            const payload = {
                target: userID, // your id
                caller: socketRef.current.id,
                sdp: peersRef.current[userID].localDescription // offer data
            };
            socketRef.current.emit("offer", payload);
        }).catch(e => console.log(e));
    }

    function handleRecieveCall(payload) {
        /*
            @params
            payload:
                caller: any - object of the caller we're receiving from
                sdp: any - handshake information

            Callback for receiving an offer from peer
        */

        peersRef.current[payload.caller.id] = createPeer(); // not initiating call
        // description object --> remote
        const desc = new RTCSessionDescription(payload.sdp);
        peersRef.current[payload.caller.id].setRemoteDescription(desc).then(() => {
            // attach streams
            userStream.current.getTracks().forEach(track => peersRef.current[payload.caller.id].addTrack(track, userStream.current));
        }).then(() => {
            return peersRef.current[payload.caller.id].createAnswer();
        }).then(answer => {
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
    }


    function handleAnswer(payload) {
        /*
            @params
            payload:
                sdp: any - handshake information
                caller: any - id of socket this answer is coming from

            Sets the remote description
        */
        
        const desc = new RTCSessionDescription(payload.sdp);
        peersRef.current[payload.caller].setRemoteDescription(desc).catch(e => console.log(e));
    }

    // recieves an event
    function handleICECandidateEvent(e) {
        if (e.candidate) {
            const payload = {
                // target: otherUser.current,
                candidate: e.candidate,
                caller: socketRef.current.id,
            }
            socketRef.current.emit("ice-candidate", payload);
        }
    }

    function handleNewICECandidateMsg(incoming) {
        const candidate = new RTCIceCandidate(incoming);

        peersRef.current[incoming.caller].addIceCandidate(candidate)
            .catch(e => console.log(e));
    }

    function handleTrackEvent(e) {
        peersRef[e.caller].current.srcObject = e.streams[0];
    };

    function generateFeeds(e) {
        // let feeds = (<div>
            if (e) {
                return peersRef[e.caller].forEach(
                    <video autoPlay ref={peersRef[e.caller]} />
                )
            }
            
        // </div>)
    
    }

    return (
        <div>
            <video autoPlay ref={userVideo} muted="muted"/>
            {/* <video autoPlay ref={partnerVideo} /> */}

            <div>
                {generateFeeds()}
            </div>
        </div>
    );
};

export default Room;