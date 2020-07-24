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
import TextField from '@material-ui/core/TextField';

import BurgerButton from './BurgerButton';
// styling component
import "./style.scss"
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

    //for chat msg
    const [state, setState] = useState({ message: '', name: '' })
    const [chat, setChat] = useState([])
    const [isShowSidebar, setIsShowSidebar] = useState(false);

    const onTextChange = e => {
      setState({ ...state, [e.target.name]: e.target.value })
    }

    const onMessageSubmit = e => {
      e.preventDefault()
      const { name, message } = state
      socketRef.current.emit('message', { name, message })
      setState({ message: '', name })
    }

    const renderChat = () => {
      return chat.map(({ name, message }, index) => (
        <div key={index}>
          <h3>
            {name}: <span>{message}</span>
          </h3>
        </div>
      ))
    }

    useEffect(() => {
        socketRef.current = io.connect("http://127.0.0.1:8000");

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

            // for chat msg
            socketRef.current.on('message', ({ name, message }) => {
                setChat([...chat, { name, message }])
              })
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
            <div
                className={`LeftSideBar__container__overlay LeftSideBar__container__overlay--${isShowSidebar ? 'show' : 'hide'}`}
                role="button"
                onClick={() => setIsShowSidebar(false)}
            ></div>
            
            <div id="user-header">
                <BurgerButton
                    onClick={() => setIsShowSidebar(true)}
                />
                <div id="meeting">
                    <h2>Castway Meeting Room</h2>
                    <button onClick={shareScreen}>Share screen</button>
                </div>
                <div id="user-video-container">
                    <video controls id="user-video" muted ref={userVideo} autoPlay playsInline/>
                </div>
            </div>
            <div className={`LeftSideBar__LeftSection LeftSideBar__LeftSection--${isShowSidebar ? 'show' : 'hide'}`}>

                <div className="LeftSideBar__LeftSection__topWrapper">
                    <BurgerButton
                        onClick={() => setIsShowSidebar(false)}
                    />
                </div>

                <div className="LeftSideBar__LeftSection__menuWrapper">
                    <div className="render-chat">
                        <h1>Chat Log</h1>
                        {renderChat()}
                    </div>
            
                    <form onSubmit={onMessageSubmit}>
                        <h1>Messenger</h1>
                        <div className="name-field">
                        <TextField
                            name="name"
                            onChange={e => onTextChange(e)}
                            value={state.name}
                            label="Name"
                        />
                        </div>
                        <div>
                        <TextField
                            name="message"
                            onChange={e => onTextChange(e)}
                            value={state.message}
                            id="outlined-multiline-static"
                            variant="outlined"
                            label="Write a message..."
                        />
                        </div>
                        <button id="send-message">Send Message</button>
                    </form>
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