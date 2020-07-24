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


// takes a peer object 
const Video = (props: any) => {
    const ref = useRef() as RefObject<HTMLVideoElement>; // video reference to grab stream

    useEffect(() => {
        props.peer.on("stream", (stream: MediaStream | MediaSource | Blob | null) => {
            (ref as any).current.srcObject = stream;
        })
    }, []);

    return (
        <div id="peer-video-container">
            <video controls id="peer-video" playsInline autoPlay ref={ref} />
            <p id="username">Username</p>
        </div>    
    );
}

interface NewPeer {
    peerID: string;
    peer: Peer.Instance;
}

const Room = (props: any) => {
    const [peers, setPeers] = useState([]) as any;
    const socketRef = useRef() as any;
    const userVideo = useRef() as any;
    const peersRef = useRef([]) as any;

    // for screenshare
    const userStream = useRef() as any;

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
        socketRef.current = io.connect("/");

        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
            userVideo.current.srcObject = stream;

            // for sharescreen
            userStream.current = stream;
        
            socketRef.current.emit("join room", roomID);

            // server emits back an event that gives all the 
            // users who are currently in the room
            // @params: an array of users
            socketRef.current.on("all users", (users: any) => {
                // *Remember this is the person who has just joined the room
                // and needs to connect with everybody else in the room*
                const peersList: [NewPeer] = [{'peerID': "0", peer: new Peer}];
                users.forEach((user: any, ind: number) => {
                    if (ind==0) {
                        peersList.pop();
                    }
                    // for each userID we are creating a newPeer (check function)
                    // send the userID, our own id and our own stream
                    let userID = user.id;
                    let newPeer = {
                        peerID: userID,
                        peer: createPeer(userID, socketRef.current.id, stream),
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
                    const peer = addPeer(payload.signal, payload.callerID, stream);
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

    // incoming signal = signal sent from the person who just joined the room
    function addPeer(incomingSignal: any, callerID: string, stream: MediaStream | undefined) {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream,
        })
    
        return peer
    }
    
    // CONVERT TO TYPESCRIPT
    function shareScreen() {
        navigator.mediaDevices.getDisplayMedia({ cursor: true }).then(stream => {
            // get video of screen
            const screenTrack = stream.getTracks()[0];
            userVideo.current.srcObject = stream;
            // on screenshare
            peersRef.current.forEach((p) => {
                p.peer._pc.getSenders().find((sender: RTCRtpSender) => sender.track.kind === "video").replaceTrack(screenTrack);
            })
            // end screenshare
            screenTrack.onended = function() {
                peersRef.current.forEach((p: any) => {
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