// Video-chat logic

import React, { useRef, useEffect } from "react";
import io from "socket.io-client";
import './styles.css'
  
const Room = (props) => {
    // references
    const userVideo = useRef();
    const partnerVideo = useRef();
    const peerRef = useRef();
    const socketRef = useRef();
    const otherUser = useRef();
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
                callUser(userID);
                otherUser.current = userID;
            });

            socketRef.current.on("user joined", userID => {
                otherUser.current = userID;
            });

            socketRef.current.on("offer", handleRecieveCall);

            socketRef.current.on("answer", handleAnswer);

            socketRef.current.on("ice-candidate", handleNewICECandidateMsg);
        });

    }, []);

    
    function callUser(userID) {
        peerRef.current = createPeer(userID);
        // go to our stream, get all the "tracks" which are the tracks we called earlier (audio and video)
        // then attach peer stream to our stream
        // give peer access to our stream
        userStream.current.getTracks().forEach(track => peerRef.current.addTrack(track, userStream.current));
    }

    // Build a webrtc peer object 
    function createPeer(userID) {
        const peer = new RTCPeerConnection({
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
        // returns a promise and resolve with offer object
        // take offer and set as remote description
        peerRef.current.createOffer().then(offer => {
            return peerRef.current.setLocalDescription(offer);
        }).then(() => {
            const payload = {
                target: userID, // your id
                caller: socketRef.current.id,
                sdp: peerRef.current.localDescription // offer data
            };
            socketRef.current.emit("offer", payload);
        }).catch(e => console.log(e));
    }

    function handleRecieveCall(incoming) {
        peerRef.current = createPeer(); // not initiating call
        // description object --> remote
        const desc = new RTCSessionDescription(incoming.sdp);
        peerRef.current.setRemoteDescription(desc).then(() => {
            // attach streams
            userStream.current.getTracks().forEach(track => peerRef.current.addTrack(track, userStream.current));
        }).then(() => {
            return peerRef.current.createAnswer();
        }).then(answer => {
            return peerRef.current.setLocalDescription(answer);
        }).then(() => {
            // send data back to the caller
            const payload = {
                target: incoming.caller,
                caller: socketRef.current.id,
                sdp: peerRef.current.localDescription
            }
            socketRef.current.emit("answer", payload);
        })
    }

    function handleAnswer(message) {
        // bc handling answer --> set remote description
        const desc = new RTCSessionDescription(message.sdp);
        peerRef.current.setRemoteDescription(desc).catch(e => console.log(e));
    }

    // recieves an event
    function handleICECandidateEvent(e) {
        if (e.candidate) {
            const payload = {
                target: otherUser.current,
                candidate: e.candidate,
            }
            socketRef.current.emit("ice-candidate", payload);
        }
    }

    function handleNewICECandidateMsg(incoming) {
        const candidate = new RTCIceCandidate(incoming);

        peerRef.current.addIceCandidate(candidate)
            .catch(e => console.log(e));
    }

    function handleTrackEvent(e) {
        partnerVideo.current.srcObject = e.streams[0];
    };

    return (
        <div>
            <video autoPlay ref={userVideo} muted="muted"/>
            <video autoPlay ref={partnerVideo} />
        </div>
    );
};

export default Room;