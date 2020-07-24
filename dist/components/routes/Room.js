"use strict";
// need to use simple-peer (simplest solution)
// because WebRTC was designed for one-to-one connection
// Simple peer is a "wrapper" for webRTC
// MESH NETWORK: simplest way to build it, BUT not super scalable
//              bc everything piles up --> need a collection of peers
//              everyone is talking to
// is this okay for us? We could make a room max?
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// facilitates group video chat
var react_1 = __importStar(require("react"));
var socket_io_client_1 = __importDefault(require("socket.io-client"));
// styling component
var styled_1 = __importDefault(require("@emotion/styled"));
// styling components
var Container = styled_1.default.div(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n    padding: 20px;\n    display: flex;\n    height: 100vh;\n    width: 90%;\n    margin: auto;\n    flex-wrap: wrap;\n"], ["\n    padding: 20px;\n    display: flex;\n    height: 100vh;\n    width: 90%;\n    margin: auto;\n    flex-wrap: wrap;\n"])));
var StyledVideo = styled_1.default.video(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n    height: 50%;\n    width: 50%;\n"], ["\n    height: 50%;\n    width: 50%;\n"])));
// takes a peer object 
var Video = function (props) {
    var ref = react_1.useRef(); // video reference to grab stream
    // takes the peer's stream
    react_1.useEffect(function () {
        props.peer.on("stream", function (stream) {
            ref.current.srcObject = stream;
        });
    }, []);
    return (react_1.default.createElement(StyledVideo, { playsInline: true, autoPlay: true, ref: ref }));
};
var videoConstraints = {
    height: window.innerHeight / 2,
    width: window.innerWidth / 2
};
var Room = function (props) {
    var _a = react_1.useState([]), peers = _a[0], setPeers = _a[1];
    var socketRef = react_1.useRef();
    var userVideo = react_1.useRef();
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
    var peersRef = react_1.useRef([]);
    var roomID = props.match.params.roomID;
    // IN PROGRESS - disconnecting
    var _b = react_1.useState(false), userDisconnects = _b[0], setUserDisconnects = _b[1];
    // join the room, only runs when you join the room for the FIRST TIME
    react_1.useEffect(function () {
        socketRef.current = socket_io_client_1.default.connect("/");
        navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: true }).then(function (stream) {
            // make it so we can see our own video
            userVideo.current.srcObject = stream;
            // emit an event stating we have joined the room
            socketRef.current.emit("join room", roomID);
            // room at capacity
            // IN PROGRESS
            socketRef.current.on("room full", function () {
                console.log("room full");
                return (
                // <Prompt message="Room is at capacity. Cannot add anymore users." />
                react_1.default.createElement("h1", null, "Room is at capacity. Cannot add anymore users."));
            });
            // server emits back an event that gives all the 
            // users who are currently in the room
            // @params: an array of users
            socketRef.current.on("all users", function (users) {
                // *Remember this is the person who has just joined the room
                // and needs to connect with everybody else in the room*
                var peers = [];
                users.forEach(function (userID) {
                    // for each userID we are creating a newPeer (check function)
                    // send the userID, our own id and our own stream
                    var peer = createPeer(userID, socketRef.current.id, stream);
                    peersRef.current.push({
                        peerID: userID,
                        peer: peer,
                    });
                    // actually passing the object to the peers array
                    // this will end up being our state
                    peers.push(peer);
                });
                setPeers(peers);
            });
            // from perspective of a person already in the room and a new user joins
            // get a payload object from the server
            socketRef.current.on("user joined", function (payload) {
                var item = peersRef.current.find(function (p) { return p.peerID === payload.callerID; });
                if (!item) {
                    // signal, who is calling us, our own stream
                    var peer_1 = addPeer(payload.signal, payload.callerID, stream);
                    // push the new peer into the users peer reference array
                    peersRef.current.push({
                        peerID: payload.callerID,
                        peer: peer_1,
                    });
                    // adjusting the peer array state by adding the new peer
                    // note the '...' syntax means 'take what's already in the array and add onto it'
                    setPeers(function (users) { return __spreadArrays(users, [peer_1]); });
                }
            });
            // recieving a RETURN signal, from the perspective of the newcomer
            socketRef.current.on("receiving returned signal", function (payload) {
                // need to actually find the person from whom you are recieving the signal
                // traverse through the peerRef array to find matching callerID
                var item = peersRef.current.find(function (p) { return p.peerID === payload.id; });
                // item = the peer reference object, then item.peer actually grabs the peer
                // actually accepting the signal from the sender, establishes a direction connection
                // completes the "handshake"
                item.peer.signal(payload.signal);
            });
            // IN PROGRESSS
            window.addEventListener("beforeunload", function (event) {
                setUserDisconnects(true);
                socketRef.current.emit("disconnect");
                // event.returnValue = "Hellooww"
            });
        });
    }, [userDisconnects]);
    // Build a webrtc peer object 
    function createPeer(userID, init) {
        /*
            @params
            userID: int - socketID reference to associate the peer with
            init: bool - was this person the call initiator

            @description
            Peer object constructor.  Also add this object to local peer master reference
        */
        var peer = new RTCPeerConnection({
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
        // capture signal event from setting 'initiator: true'
        peer.on("signal", function (signal) {
            socketRef.current.emit("sending signal", { userToSignal: userToSignal, callerID: callerID, signal: signal });
        });
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
        peersRef.current[userID].createOffer().then(function (offer) {
            return peersRef.current[userID].setLocalDescription(offer);
        }).then(function () {
            var payload = {
                target: userID,
                caller: socketRef.current.id,
                sdp: peersRef.current[userID].localDescription // offer data
            };
            socketRef.current.emit("offer", payload);
        }).catch(function (e) { return console.log(e); });
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
        var desc = new RTCSessionDescription(payload.sdp);
        peersRef.current[payload.caller.id].setRemoteDescription(desc).then(function () {
            // attach streams
            userStream.current.getTracks().forEach(function (track) { return peersRef.current[payload.caller.id].addTrack(track, userStream.current); });
        }).then(function () {
            return peersRef.current[payload.caller.id].createAnswer();
        }).then(function (answer) {
            return peersRef.current.setLocalDescription(answer);
        }).then(function () {
            // send data back to the caller
            var newPayload = {
                target: payload.caller,
                caller: socketRef.current.id,
                sdp: peersRef.current.localDescription
            };
            socketRef.current.emit("answer", newPayload);
        });
        // signal event actually fired when this peer is recieving
        // an offer from someone who wants to connect to them
        // (recieving signal)
        peer.on("signal", function (signal) {
            // return a signal by sending signal and the person who called us
            socketRef.current.emit("returning signal", { signal: signal, callerID: callerID });
        });
        // accept incoming signal --> triggers the event above --> 
        // causing a signal to be returned to caller
        peer.signal(incomingSignal);
        return peer;
    }
    return (react_1.default.createElement(Container, null,
        react_1.default.createElement(StyledVideo, { muted: true, ref: userVideo, autoPlay: true, playsInline: true }),
        peers.map(function (peer, index) {
            return (
            // reference Video above to understand how this works! :)
            react_1.default.createElement(Video, { key: index, peer: peer }));
        })));
};
exports.default = Room;
var templateObject_1, templateObject_2;
//# sourceMappingURL=Room.js.map