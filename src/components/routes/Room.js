import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
//components
import Sent from "../images/sent.png";
// styling component
import { withStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import { createMuiTheme, ThemeProvider } from "@material-ui/core";

import "./style.scss"
import "./styles.css"

//adding markdown to chat feature
import ReactMarkdown from "react-markdown";
import { isEqual } from "lodash";

//styles to the TextFields
const theme = createMuiTheme({
    overrides: {
      MuiInputLabel: { // Name of the component / style sheet
        root: { // Name of the rule
          color: "white",
        }
      }
    }
  });

const CssTextField = withStyles({
    root: {
      '& label.Mui-focused': {
        color: 'white',
      },
      '& .MuiInput-underline:after': {
        borderBottomColor: 'white',
      },
      '& .MuiOutlinedInput-root': {
        '& fieldset': {
          borderColor: 'white',
        },
        '&:hover fieldset': {
          borderColor: 'white',
        },
        '&.Mui-focused fieldset': {
          borderColor: 'white',
        },
      },
    },
  })(TextField);

const Video = ({peer, ui}) => {
    const ref = useRef();
    console.log(ui);

    useEffect((ui) => {
        const f = stream => {
            ref.current.srcObject = stream;
        };
        peer.on('stream', f)
        peer.on('close', function(ui) {
            console.log('closed')
            console.log(ui)
            // document.getElementById(ui).remove();
        });
        // peer.on('disconnected', function() { 
        //     console.log('disconnected')
        // });
        peer.on('error', function() { 
            console.log('error')
        });
        // window.BeforeUnloadEvent(() => {
        //     peer.destroy();
        // })
        // window.onbeforeunloaded --> peer destroy --> then close event 
        return () => {
            peer.on('stream', null);
        };
    }, [peer]);

    return (
        <div className="peer-video-container">
            <video controls id={ui} className="peer-video" playsInline autoPlay ref={ref} />
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

    // var _ = require("lodash")

    const roomID = props.match.params.roomID;

    //for chat msg
    //individual message tied to the message box
    const [state, setState] = useState({ message: '', name: '' })
    //keep track of who's message it is
    const [yourID, setYourID] = useState();
    //array of messages
    const [chat, setChat] = useState([]);
    
    const [isShowSidebar, setIsShowSidebar] = useState(false);

    const onTextChange = e => {
        setState({ ...state, [e.target.name]: e.target.value })
    }

    const onMessageSubmit = e => {
      e.preventDefault()

    //   const { name, message } = state
      const messageObject = {
        message: state.message,
        name: state.name,
        id: yourID,
      };
      
    //  setState({ message: '', name })
        if(state.message !== '' && state.name !== ''){
            setState({ message: '', name: state.name });
            //send message object down to server
            socketRef.current.emit('message', messageObject)
        }
    }

    useEffect(() => {
        socketRef.current = io.connect("https://castway.app");

        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
            userVideo.current.srcObject = stream;

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
                    // peerIDs[userID] = stream;
                })
                setPeers(peers);
            })

           
            
            // if (gainNode.gain > 1) {
            //     detectAudio.style.borderColor = "red";
            // } else {
            //     // detectAudio.style.borderColor = "none";
            // }


            socketRef.current.on("user joined", payload => {
                const item = peersRef.current.find(p => p.peerID === payload.callerID);
                if(!item) {
                    const peer = addPeer(payload.signal, payload.callerID, stream);
                    peersRef.current.push({
                        peerID: payload.callerID,
                        peer,
                    })
                    // peerIDs[payload.callerID] = stream;
                    setPeers(users => [...users, peer]);
                }
            });

            socketRef.current.on("receiving returned signal", payload => {
                const item = peersRef.current.find(p => p.peerID === payload.id);
                item.peer.signal(payload.signal);
            });

            // for chat msg
            //listen to the event for when you are connecting, in return the server sends to the client your own id,
            //so the server can keep track of who you are
            socketRef.current.on("your id", id => {
                setYourID(id);
            })
            // socketRef.current.on('message', ({ name, message }) => {
            //     setChat(chat => [...chat, { name, message }])
            // })
            socketRef.current.on('message', (state) => {
                setChat(chat => [...chat, state])
            })

            socketRef.current.on("user-disconnected", users => {
                users.forEach(userID => {
                    console.log(userID)
                })
            })
        })

        // window.onload = (e) => {
        //    volumeDetector();
        // };

    }, [roomID]);

    //@params: the Id of the person they are calling, their caller ID, and their stream
    function createPeer(userToSignal, callerID, stream) {
        console.log(userToSignal)
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
        console.log(incomingSignal)
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

    // STILL WORKING ON THIS
    var muteBool = true;
    // var svg = muteButton.getElementsByTagName("svg").item(0)
    function mute() {
        const muteButton = document.getElementById("mute-button");
        navigator.mediaDevices.getUserMedia({ video: false, audio: true }).then(stream => {
            const audioTrack = stream.getTracks()[0];
            if(muteBool) {
                peersRef.current.forEach((p) => {
                    p.peer._pc.getSenders().find(sender => sender.track.kind === "audio").replaceTrack(null);
                    
                })
                muteBool = false;
                // muteButton.style.borderColor = "red";
                muteButton.setAttribute("style", "background-color: white; opacity: 0.9; transition: ease 1s")
                console.log("muted")
            } else {
                peersRef.current.forEach((p) => {
                    p.peer._pc.getSenders()[0].replaceTrack(audioTrack);
                })
                muteBool = true;
                // muteButton.style.fill = "none";
                muteButton.setAttribute("style", "background-color: #031321; transition: ease 1s")
                console.log("unmuted")
            }
        })
    }

    function volumeDetector() {
//         navigator.getUserMedia = navigator.getUserMedia ||
//   navigator.webkitGetUserMedia ||
//   navigator.mozGetUserMedia;
// if (navigator.getUserMedia) {
//   navigator.getUserMedia({
//       audio: true
//     },
    console.log("hello!")
    
    peersRef.current.forEach((p) => {
        console.log(p.peer);
    })

    // function(stream) {
    //   let audioContext = new AudioContext();
    //   let analyser = audioContext.createAnalyser();
    //   let microphone = audioContext.createMediaStreamSource(stream);
    //   let javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

    //    let el = document.getElementById("peer-container")
    // let el = document.getElementsByClassName("peer-video-container");
    // let el = document.querySelectorAll(".peer-video")
    // let el = document.getElementById("user-video")
    // console.log(el)

    //   analyser.smoothingTimeConstant = 0.8;
    //   analyser.fftSize = 1024;

    //   microphone.connect(analyser);
    //   analyser.connect(javascriptNode);
    //   javascriptNode.connect(audioContext.destination);

    //   canvasContext = $("#canvas")[0].getContext("2d");

    //   javascriptNode.onaudioprocess = function() {
    //       var array = new Uint8Array(analyser.frequencyBinCount);
    //       analyser.getByteFrequencyData(array);
    //       var values = 0;

    //       var length = array.length;
    //       for (var i = 0; i < length; i++) {
    //         values += (array[i]);
    //       }

    //       var avg = values / length;

    //       console.log(avg)

    //     if(avg > 20) {
    //         el.setAttribute("style", "border: solid red")
            // el.style.borderColor = "red";
            // document.querySelectorAll(className).forEach(el => {
            //     el.style.transition = "opacity 0.5s linear 0s";
            //     el.style.opacity = 0.5;
            // });
        // } else {
        //     el.setAttribute("style", "border: none")
            // el.style.borderColor = "none";
        // }

        //  console.log(Math.round(avg - 40));

        //   canvasContext.clearRect(0, 0, 150, 300);
        //   canvasContext.fillStyle = '#BadA55';
        //   canvasContext.fillRect(0, 300 - average, 150, 300);
        //   canvasContext.fillStyle = '#262626';
        //   canvasContext.font = "48px impact";
        //   canvasContext.fillText(Math.round(average - 40), -2, 300);

//         } // end fn stream
//     },
//     function(err) {
//       console.log("The following error occured: " + err.name)
//     });
// } else {
//   console.log("getUserMedia not supported");
// }
        // var volumemeter = require('volume-meter')
        // var getusermedia = require('getusermedia')
        
        // var ctx = new AudioContext()
        // var el = document.getElementById("peer-container")

        // console.log(el)
        // console.log(el[0])
        
        // var meter = volumemeter(ctx, { tweenIn: 2, tweenOut: 6 }, function (volume) {
        //     // el.style.height = volume + '%'
        //     console.log(volume)
        //     el.setAttribute("style", "border: solid red")
        // })
        
        // navigator.mediaDevices.getUserMedia({ audio: true, video: false }, function (err, stream) {
        //     if (err) return console.error(err)
            
        //     var src = ctx.createMediaStreamSource(stream)
        //     src.connect(meter)
        //     src.connect(ctx.destination)
        //     stream.onended = meter.stop.bind(meter)
        // })
    }

     // STILL WORKING ON THIS
     // adapt to work for when people are added
    //  let videoBool = true;
     function camera() {
    //      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
    //          const screenTrack = stream.getTracks()[1];
    //              if(muteBool) {
    //                 peersRef.current.forEach((p) => {
    //                     p.peer._pc.getSenders().find(sender => sender.track.kind === "video").replaceTrack(null);
    //                 })
    //                 videoBool = false;
    //                 //  userVideo.stream.srcObject = null;
    //                  // return (
    //                  // );
 
    //              } else {
    //                 peersRef.current.forEach((p) => {
    //                     p.peer._pc.getSenders()[1].replaceTrack(screenTrack);
    //                 })
    //                 videoBool = true;
    //              }
    //         //  })   
    //      })
     }

    return (
        // wrapping tag
        <div>
            <div
                className={`LeftSideBar__container__overlay LeftSideBar__container__overlay--${isShowSidebar ? 'show' : 'hide'}`}
                role="button"
                onClick={() => setIsShowSidebar(false)}
            ></div>
            
            <div id="user-header">
                
                <div id="meeting">
                    <p id="castway" onClick={volumeDetector}>Castway Meeting Room</p>
                </div>
                <div id="user-video-container">
                    <video controls id="user-video" muted ref={userVideo} autoPlay playsInline/>
                    {/* <button onClick={mute}>Mute</button> */}
                    <div className="icon sharescreen" onClick={shareScreen}>
                        <svg id="Capa_1" enableBackground="new 0 0 512 512" height="512" viewBox="0 0 512 512" width="512" xmlns="http://www.w3.org/2000/svg">
                        <g id="Line_cutting_stoke_Expand"><g><path d="m464 376h-48v16h56c4.418 0 8-3.582 8-8v-40h-16z"/><path d="m384 376h16v16h-16z"/>
                        <path d="m464 312h16v16h-16z"/><path d="m48 120h16v-16h-24c-4.418 0-8 3.582-8 8v56h16z"/><path d="m80 104h16v16h-16z"/>
                        <path d="m32 184h16v16h-16z"/><path d="m480 240h-96v16h96v24h-96v16h104c4.418 0 8-3.582 8-8v-176h-16z"/>
                        <path d="m478 32h-348c-9.936.012-17.988 8.064-18 18v150h16v-150c0-1.105.895-2 2-2h348c1.105 0 2 .895 2 2v46h16v-46c-.012-9.936-8.064-17.988-18-18z"/>
                        <path d="m472 96v-24c0-4.418-3.582-8-8-8h-24v16h16v16z"/><path d="m48 234c0-1.105.895-2 2-2h300c1.105 0 2 .895 2 2v174h16v-174c-.012-9.936-8.064-17.988-18-18h-300c-9.936.012-17.988 8.064-18 18v174h16z"/>
                        <path d="m376 424h-128c-1.242 0-2.467.289-3.578.845l-14.311 7.155h-60.222l-14.311-7.155c-1.111-.556-2.336-.845-3.578-.845h-80v16h78.111l14.311 7.155c1.111.556 2.336.845 3.578.845h64c1.242 0 2.467-.289 3.578-.845l14.311-7.155h118.111v12c-.007 6.624-5.376 11.993-12 12h-312c-6.624-.007-11.993-5.376-12-12v-12h24v-16h-32c-4.418 0-8 3.582-8 8v20c.018 15.457 12.543 27.982 28 28h312c15.457-.018 27.982-12.543 28-28v-20c0-4.418-3.582-8-8-8z"/><path d="m344 408v-160c0-4.418-3.582-8-8-8h-48v16h40v152z"/><path d="m272 240h-208c-4.418 0-8 3.582-8 8v160h16v-152h200z"/>
                        <path d="m320 304v-24c0-4.418-3.582-8-8-8h-24v16h16v16z"/><path d="m80 376v24c0 4.418 3.582 8 8 8h24v-16h-16v-16z"/></g></g></svg>
                    </div>
                    <div className="icon muted" id="mute-button" onClick={mute}>
                        {/* <svg id="Capa_1" enable-background="new 0 0 512 512" height="512" viewBox="0 0 512 512" width="512" xmlns="http://www.w3.org/2000/svg"><g><path d="m430.453 70.736c-81.402-78.405-198.224-90.066-289.578-42.741-6.927 3.588-11.593 10.393-12.481 18.204-.895 7.87 2.158 15.617 8.167 20.722l9.569 8.129c8.311 7.06 20.017 8.671 29.824 4.108 68.492-31.87 154.98-21.271 214.153 36.887 57.811 56.819 71.59 141.388 44.728 210.816-1.772 4.577-7.334 6.023-11.006 2.914l-65.046-55.082v-131.553c0-25.356-26.822-41.377-48.843-29.423l-86.069 46.733c-9.303-7.909-93.215-79.246-106.595-90.62-10.6-9.004-26.095-8.537-36.045 1.082-102.046 98.67-105.248 264.167-3.931 366.376 91.384 92.188 235.516 99.429 335.334 19.693 12.661-10.113 12.94-29.376.604-39.876l-7.327-6.237c-9.371-7.98-23.208-8.281-32.897-.72-74.297 57.952-181.126 54.042-251.261-15.754-70.856-70.515-75.946-179.773-18.658-256.048.617-.822 1.695-.968 2.445-.331l44.572 37.821c-17.975 5.134-31.189 21.832-31.189 41.596v77.077c0 23.839 19.215 43.233 42.833 43.233 16.861 1.262 30.494-3.421 48.182 6.186 15.899 8.632 89.183 48.422 100.002 54.297 22.088 11.992 48.842-4.146 48.842-29.422v-.001-15.896c11.196 9.553 48.54 41.417 58.259 49.709 15.959 13.585 40.165 9.969 51.479-7.713 64.279-100.44 52.363-237.066-38.067-324.166zm-91.669 72.404v114.618l-23.961-20.29v-103.645l4.663-2.532c8.856-4.809 19.298 1.828 19.298 11.849zm-98.538 31.174 54.577-29.633v75.849c-19.578-16.578-43.079-36.479-54.577-46.216zm-78.489 143.431c-12.59 0-22.833-10.424-22.833-23.236v-77.077c0-12.812 10.243-23.236 22.833-23.236h9.993l13.575 11.519v112.029h-23.568zm177.027 51.057c0 7.774-6.218 13.322-12.88 13.454-4.851.095-7.6-2.502-11.081-4.136v-62.516c2.901 2.462 23.546 19.98 23.961 20.332zm112.892 15.323c-4.78 7.468-14.893 9.03-21.67 3.263-.103-.087-149.104-126.953-142.48-121.177-4.212-3.574-10.521-3.056-14.095 1.153-3.574 4.21-3.058 10.52 1.153 14.093l20.238 17.174v68.629c-76.274-40.838-76.672-43.001-89.497-46.711v-97.862l7.762 6.587c4.832 4.101 12.202 2.724 15.244-2.821 2.238-4.077 1.382-9.299-2.303-12.425-4.624-3.924-106.906-90.716-107.546-91.259-9.498-8.059-23.84-6.466-31.378 3.568-63.077 83.979-57.645 204.423 20.541 282.231 77.717 77.342 195.935 81.101 277.671 17.347 2.28-1.779 5.418-1.704 7.631.18l7.327 6.237c2.778 2.365 2.705 6.767-.122 9.025-91.88 73.394-224.512 66.729-308.646-18.146-92.97-93.791-90.955-246.47 3.63-337.925 2.518-2.435 6.471-2.529 9.193-.217 52.49 44.598 173.772 147.639 306.575 259.966 14.142 11.977 35.862 6.417 42.584-10.958 29.673-76.695 14.312-169.714-49.359-232.293-64.368-63.264-159.575-76.601-236.613-40.757-2.75 1.28-6.061.801-8.437-1.218l-9.568-8.128c-1.899-1.613-1.636-4.79.564-5.931 84.453-43.748 191.876-32.49 266.503 39.389 83.555 80.478 94.238 206.569 35.098 298.986z"/><path d="m260.12 244.412c-1.843-4.491-6.662-6.899-11.19-5.979-5.573 1.132-8.903 6.485-7.85 11.758 1.152 5.565 6.48 8.912 11.76 7.849 6.22-1.262 9.684-7.855 7.28-13.628z"/></g></svg> */}
                        <svg height="416pt" viewBox="-55 0 416 416.238" width="416pt" xmlns="http://www.w3.org/2000/svg"><path d="m290.28125 27.679688-56.101562 56.097656v-4.816406c0-43.609376-35.351563-78.960938-78.960938-78.960938s-78.960938 35.351562-78.960938 78.960938v141.78125c.003907 6.300781.761719 12.578124 2.257813 18.699218l-25.140625 25.140625c-6.25-14.203125-9.464844-29.554687-9.433594-45.074219 0-5.523437-4.476562-10-10-10-5.519531 0-10 4.476563-10 10-.046875 20.886719 4.902344 41.484376 14.4375 60.070313l-35.300781 35.300781c-2.542969 2.523438-3.542969 6.210938-2.621094 9.675782.921875 3.460937 3.625 6.164062 7.085938 7.089843 3.464843.921875 7.15625-.078125 9.679687-2.625l31.96875-31.96875c3.988282 5.4375 8.386719 10.5625 13.15625 15.328125 21.5625 21.664063 50.058594 35.054688 80.5 37.824219v46.035156h-37.082031c-5.523437 0-10 4.476563-10 10 0 5.523438 4.476563 10 10 10h98.902344c5.523437 0 10-4.476562 10-10 0-5.523437-4.476563-10-10-10h-41.832031v-45.671875c69.464843-3.945312 123.746093-61.476562 123.65625-131.054687 0-5.523438-4.476563-10-10-10-5.523438 0-10 4.476562-10 10-.03125 45.007812-27.148438 85.570312-68.722657 102.796875-41.578125 17.226562-89.4375 7.730468-121.289062-24.0625-4.777344-4.777344-9.113281-9.976563-12.953125-15.53125l23.035156-23.035156c14.019531 24.71875 40.234375 40 68.652344 40.023437 43.539062 0 78.960937-35.636719 78.960937-79.441406v-108.195313l70.246094-70.246094c3.90625-3.90625 3.90625-10.238281 0-14.140624-3.90625-3.90625-10.238281-3.90625-14.140625 0zm-194.027344 193.066406v-141.78125c0-32.5625 26.398438-58.960938 58.960938-58.960938s58.960937 26.398438 58.960937 58.960938v24.816406l-117.902343 117.902344c0-.316406-.019532-.625-.019532-.9375zm117.921875-.480469c0 32.773437-26.449219 59.441406-58.960937 59.441406-23.234375-.027343-44.292969-13.679687-53.800782-34.878906l112.761719-112.761719zm0 0"/></svg>
                    </div>
                    <div className="icon camera" onClick={camera}>
                        <svg id="Capa_1" enableBackground="new 0 0 512 512" height="512" viewBox="0 0 512 512" width="512" xmlns="http://www.w3.org/2000/svg"><g><path d="m508.306 214.116c-2.289-1.351-5.121-1.395-7.448-.114l-93.669 51.57v-17.97c0-19.041-15.491-34.532-34.532-34.532h-19.53c26.414-16.951 43.951-46.581 43.951-80.23 0-16.913-4.491-33.527-12.988-48.047-2.097-3.583-6.7-4.789-10.281-2.69-3.582 2.096-4.786 6.699-2.69 10.281 7.151 12.219 10.93 26.209 10.93 40.457 0 44.239-35.991 80.23-80.23 80.23s-80.23-35.991-80.23-80.23 35.991-80.231 80.23-80.231c18.841 0 37.15 6.66 51.553 18.754 3.18 2.669 7.918 2.257 10.587-.924 2.669-3.178 2.256-7.918-.923-10.587-17.107-14.363-38.847-22.273-61.217-22.273-46.522 0-85.35 33.526-93.622 77.684-12.668-15.371-31.844-25.188-53.272-25.188-38.053 0-69.011 30.959-69.011 69.012 0 21.84 10.209 41.329 26.093 53.984-19.023.021-34.493 15.503-34.493 34.531v1.217h-30.596l-36.183-17.141c-4.765-2.431-10.89 1.445-10.732 6.791v93.253c-.161 5.348 5.975 9.223 10.732 6.792l36.183-17.141h30.597v118.511c0 19.042 15.491 34.533 34.532 34.533h195.676c4.15 0 7.515-3.364 7.515-7.515s-3.364-7.515-7.515-7.515h-195.676c-10.754 0-19.503-8.749-19.503-19.504v-192.281c0-10.754 8.749-19.503 19.503-19.503h260.61c10.754 0 19.503 8.748 19.503 19.503v192.283c0 10.754-8.749 19.504-19.503 19.504h-34.876c-4.15 0-7.515 3.364-7.515 7.515s3.364 7.515 7.515 7.515h34.876c19.041 0 34.532-15.491 34.532-34.533v-59.647l93.669 51.57c4.77 2.821 11.31-1.043 11.139-6.583v-204.641c0-2.658-1.404-5.118-3.691-6.47zm-493.274 36.229 22.68 10.745v48.015l-22.68 10.745zm37.71 56.001v-42.497h24.773v42.497zm48.201-147.258c0-29.766 24.216-53.983 53.982-53.983s53.983 24.217 53.983 53.983-24.216 53.983-53.983 53.983c-29.765 0-53.982-24.217-53.982-53.983zm96.902 53.983c10.117-8.06 17.922-18.892 22.259-31.344 7.591 12.641 18.019 23.391 30.413 31.344zm299.123 199.441-89.778-49.429v-80.353l89.778-49.429z"/><path d="m263.508 132.841c0 21.125 17.186 38.311 38.311 38.311 21.124 0 38.311-17.186 38.311-38.311s-17.186-38.311-38.311-38.311-38.311 17.186-38.311 38.311zm61.592 0c0 12.837-10.444 23.281-23.281 23.281-12.838 0-23.282-10.444-23.282-23.281s10.444-23.282 23.282-23.282c12.837.001 23.281 10.445 23.281 23.282z"/><path d="m154.925 186.162c14.929 0 27.074-12.146 27.074-27.074s-12.145-27.073-27.074-27.073c-14.928 0-27.074 12.145-27.074 27.073.001 14.929 12.146 27.074 27.074 27.074zm0-39.118c6.642 0 12.045 5.403 12.045 12.044 0 6.642-5.403 12.045-12.045 12.045-6.641 0-12.044-5.403-12.044-12.045 0-6.641 5.403-12.044 12.044-12.044z"/><path d="m330.267 363.344v-81.979c0-9.668-7.866-17.534-17.534-17.534h-81.281c-4.15 0-7.515 3.364-7.515 7.515s3.364 7.515 7.515 7.515h81.281c1.381 0 2.505 1.123 2.505 2.505v81.979c0 1.382-1.124 2.505-2.505 2.505h-140.762c-1.381 0-2.505-1.123-2.505-2.505v-81.979c0-1.382 1.124-2.505 2.505-2.505h29.423c4.15 0 7.515-3.364 7.515-7.515s-3.364-7.515-7.515-7.515h-29.423c-9.668 0-17.534 7.866-17.534 17.534v81.979c0 9.668 7.866 17.534 17.534 17.534h140.762c9.668 0 17.534-7.866 17.534-17.534z"/><path d="m282.778 406.998c-4.15 0-7.514 3.364-7.514 7.515s3.364 7.515 7.514 7.515h18.745c4.15 0 7.515-3.364 7.515-7.515s-3.364-7.515-7.515-7.515z"/><path d="m232.979 406.998c-4.15 0-7.515 3.364-7.515 7.515s3.364 7.515 7.515 7.515h18.746c4.15 0 7.515-3.364 7.515-7.515s-3.364-7.515-7.515-7.515z"/><path d="m183.179 406.998c-4.15 0-7.515 3.364-7.515 7.515s3.365 7.515 7.515 7.515h18.746c4.15 0 7.515-3.364 7.515-7.515s-3.364-7.515-7.515-7.515z"/></g></svg>
                    </div>
                    {/* <BurgerButton onClick={() => setIsShowSidebar(true)} /> */}
                    <div className="icon chat-button" onClick={() => setIsShowSidebar(true)}>
                        {/* <svg viewBox="0 -26 512 512" xmlns="http://www.w3.org/2000/svg"><path d="m256 100c-5.519531 0-10 4.480469-10 10s4.480469 10 10 10 10-4.480469 10-10-4.480469-10-10-10zm0 0"/><path d="m90 280c5.519531 0 10-4.480469 10-10s-4.480469-10-10-10-10 4.480469-10 10 4.480469 10 10 10zm0 0"/><path d="m336 0c-90.027344 0-163.917969 62.070312-169.632812 140.253906-85.738282 4.300782-166.367188 66.125-166.367188 149.746094 0 34.945312 13.828125 68.804688 39 95.632812 4.980469 20.53125-1.066406 42.292969-16.070312 57.296876-2.859376 2.859374-3.714844 7.160156-2.167969 10.898437 1.546875 3.734375 5.191406 6.171875 9.238281 6.171875 28.519531 0 56.003906-11.183594 76.425781-30.890625 19.894531 6.78125 45.851563 10.890625 69.574219 10.890625 90.015625 0 163.898438-62.054688 169.628906-140.222656 20.9375-.929688 42.714844-4.796875 59.945313-10.667969 20.421875 19.707031 47.90625 30.890625 76.425781 30.890625 4.046875 0 7.691406-2.4375 9.238281-6.171875 1.546875-3.738281.691407-8.039063-2.167969-10.898437-15.003906-15.003907-21.050781-36.765626-16.070312-57.296876 25.171875-26.828124 39-60.6875 39-95.632812 0-86.886719-86.839844-150-176-150zm-160 420c-23.601562 0-50.496094-4.632812-68.511719-11.800781-3.859375-1.539063-8.269531-.527344-11.078125 2.539062-12.074218 13.199219-27.773437 22.402344-44.878906 26.632813 9.425781-18.058594 11.832031-39.347656 6.097656-59.519532-.453125-1.589843-1.292968-3.042968-2.445312-4.226562-22.6875-23.367188-35.183594-53.066406-35.183594-83.625 0-70.46875 71.4375-130 156-130 79.851562 0 150 55.527344 150 130 0 71.683594-67.289062 130-150 130zm280.816406-186.375c-1.152344 1.1875-1.992187 2.640625-2.445312 4.226562-5.734375 20.171876-3.328125 41.460938 6.097656 59.519532-17.105469-4.226563-32.804688-13.433594-44.878906-26.632813-2.808594-3.0625-7.21875-4.078125-11.078125-2.539062-15.613281 6.210937-37.886719 10.511719-58.914063 11.550781-2.921875-37.816406-21.785156-73.359375-54.035156-99.75h130.4375c5.523438 0 10-4.476562 10-10s-4.476562-10-10-10h-161.160156c-22.699219-11.554688-48.1875-18.292969-74.421875-19.707031 5.746093-67.164063 70.640625-120.292969 149.582031-120.292969 84.5625 0 156 59.53125 156 130 0 30.558594-12.496094 60.257812-35.183594 83.625zm0 0"/><path d="m256 260h-126c-5.523438 0-10 4.476562-10 10s4.476562 10 10 10h126c5.523438 0 10-4.476562 10-10s-4.476562-10-10-10zm0 0"/><path d="m256 320h-166c-5.523438 0-10 4.476562-10 10s4.476562 10 10 10h166c5.523438 0 10-4.476562 10-10s-4.476562-10-10-10zm0 0"/><path d="m422 100h-126c-5.523438 0-10 4.476562-10 10s4.476562 10 10 10h126c5.523438 0 10-4.476562 10-10s-4.476562-10-10-10zm0 0"/></svg> */}
                        <svg id="Capa_1" enableBackground="new 0 0 513 513" height="512" viewBox="0 0 513 513" width="512" xmlns="http://www.w3.org/2000/svg"><g><path d="m340.5 320.88c26.191 0 47.5-21.309 47.5-47.5v-65.5c0-4.142-3.357-7.5-7.5-7.5s-7.5 3.358-7.5 7.5v65.5c0 17.92-14.579 32.5-32.5 32.5h-242.675c-7.274 0-14.387 2.961-19.514 8.123l-43.267 43.573c-3.8 2.89-8.612 3.384-12.947 1.307-4.444-2.129-7.097-6.343-7.097-11.273v-51.73c0-4.142-3.357-7.5-7.5-7.5s-7.5 3.358-7.5 7.5v51.73c0 10.684 5.984 20.187 15.618 24.801 3.828 1.833 7.896 2.734 11.932 2.734 6.123 0 12.172-2.074 17.191-6.112.217-.175.425-.361.621-.559l43.594-43.902c2.33-2.347 5.563-3.692 8.869-3.692h30.175v50.5c0 26.191 21.309 47.5 47.5 47.5h147.5c4.143 0 7.5-3.358 7.5-7.5s-3.357-7.5-7.5-7.5h-147.5c-17.921 0-32.5-14.58-32.5-32.5v-50.5z"/><path d="m465.5 127.88h-77.5v-40.5c0-26.191-21.309-47.5-47.5-47.5h-293c-26.191 0-47.5 21.308-47.5 47.5v174.5c0 4.142 3.357 7.5 7.5 7.5s7.5-3.358 7.5-7.5v-174.5c0-17.92 14.579-32.5 32.5-32.5h293c17.921 0 32.5 14.58 32.5 32.5v86.5c0 4.142 3.357 7.5 7.5 7.5s7.5-3.358 7.5-7.5v-31h77.5c17.921 0 32.5 14.58 32.5 32.5v75.5c0 4.142 3.357 7.5 7.5 7.5s7.5-3.358 7.5-7.5v-75.5c0-26.192-21.309-47.5-47.5-47.5z"/><path d="m505.5 277.38c-4.143 0-7.5 3.358-7.5 7.5v160.73c0 5.318-6.456 8.824-8.436 9.772-7.351 3.522-16.479 3.659-21.282.421l-32.96-43.073c-.195-.256-.407-.499-.634-.727-5.127-5.162-12.239-8.123-19.514-8.123h-58.174c-4.143 0-7.5 3.358-7.5 7.5s3.357 7.5 7.5 7.5h58.175c3.164 0 6.261 1.232 8.564 3.396l33.265 43.472c.365.478.786.909 1.255 1.286 5.401 4.345 12.255 6.087 19.095 6.087 6.703 0 13.394-1.673 18.69-4.21 10.617-5.085 16.956-13.795 16.956-23.3v-160.731c0-4.142-3.357-7.5-7.5-7.5z"/><path d="m224 180.38c0-16.542-13.458-30-30-30s-30 13.458-30 30 13.458 30 30 30 30-13.458 30-30zm-45 0c0-8.271 6.729-15 15-15s15 6.729 15 15-6.729 15-15 15-15-6.729-15-15z"/><path d="m306.866 183.226c.089-.942.134-1.899.134-2.846 0-16.542-13.458-30-30-30-.476 0-.948.011-1.416.033-16.028.747-28.584 13.91-28.584 29.967 0 16.542 13.458 30 30 30 15.564 0 28.403-11.673 29.866-27.154zm-44.866-2.846c0-8.028 6.273-14.609 14.285-14.983.237-.011.476-.017.715-.017 8.271 0 15 6.729 15 15 0 .479-.022.964-.067 1.438-.73 7.731-7.15 13.562-14.933 13.562-8.271 0-15-6.729-15-15z"/><path d="m141 180.38c0-16.542-13.458-30-30-30s-30 13.458-30 30 13.458 30 30 30 30-13.458 30-30zm-45 0c0-8.271 6.729-15 15-15s15 6.729 15 15-6.729 15-15 15-15-6.729-15-15z"/></g></svg>
                    </div>
                    {/* <div className="icon send" id="sentBtn" alt="Send Message" onClick={onMessageSubmit}>
                            <svg id="Capa_1" enable-background="new 0 0 512 512" height="512" viewBox="0 0 512 512" width="512" xmlns="http://www.w3.org/2000/svg"><g><path d="m502.978 58.481-208.557 42.743c-4.057.831-6.672 4.795-5.841 8.852s4.793 6.672 8.852 5.841l142.986-29.304-351.145 159.051-64.755-39.062c-15.29-9.226-11.298-32.432 6.201-36.022l238.506-48.881c4.057-.831 6.672-4.795 5.841-8.852-.832-4.057-4.797-6.672-8.852-5.841l-238.509 48.88c-30.905 6.34-37.948 47.258-10.936 63.558l65.223 39.346 33.832 188.689c.422 2.365 2.011 4.415 4.134 5.436 0 0 .001 0 .001.001 2.375.966 4.457 1.12 6.829-.172l145.508-79.141 66.004 39.822c18.364 11.068 42.61 2.985 50.287-17.483l122.918-327.479c2.095-5.507-2.788-11.158-8.527-9.982zm-320.732 260.79 75.167 45.352-119.479 64.985zm192.3 71.399c-4.312 11.498-18 16.237-28.498 9.909l-154.038-92.935 48.658-36.199c3.323-2.472 4.013-7.17 1.541-10.493-2.457-3.307-7.156-4.024-10.493-1.541l-57.621 42.867c-1.131.88-1.943 1.886-2.483 3.222l-45.632 113.626-28.793-160.582 346.888-157.122-188.536 140.265c-3.34 2.485-4.001 7.186-1.541 10.493 2.48 3.334 7.179 4.006 10.493 1.541l224.012-166.657z"/></g></svg>
                        </div> */}
                    {/* <div>Icons made by <a href="https://www.flaticon.com/authors/pixel-perfect" title="Pixel perfect">Pixel perfect</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div> */}
                </div>
            </div>
            <div className={`LeftSideBar__LeftSection LeftSideBar__LeftSection--${isShowSidebar ? 'show' : 'hide'}`}>

                {/* <div className="LeftSideBar__LeftSection__topWrapper">
                    <BurgerButton
                        onClick={() => setIsShowSidebar(false)}
                    />
                </div> */}

                <div className="LeftSideBar__LeftSection__menuWrapper">
                    <div id="chatLog">
                        <h1>Chat Log</h1>
                    </div>
                    <div className="render-chat">
                        {chat.map((state, index) => {
                           if(state.id === yourID){
                            return(
                                <div id="MyRow" key={index}>
                                    <div id="MyMessage">
                                        {state.name}: <ReactMarkdown className="markdown">{state.message}</ReactMarkdown>
                                    </div>
                                </div>
                            )
                        }
                            return(
                                <div id="PartnerRow" key={index}>
                                    <div id="PartnerMessage">
                                    {state.name}: <ReactMarkdown className="markdown">{state.message}</ReactMarkdown>
                                    </div>
                                </div>
                            )
                        })}
                        
                    </div>
            
                    <form onSubmit={onMessageSubmit}>
                        <div className="name-field">
                        <ThemeProvider theme={theme}>
                        <CssTextField
                            name="name"
                            onChange={e => onTextChange(e)}
                            value={state.name}
                            label="Name"
                            inputProps={{ style: { 
                                fontFamily: 'Inconsolata', 
                                color: 'white' }
                            }}
                            autoComplete="off"
                        />
                        </ThemeProvider>
                        </div>
                        <div>
                        <CssTextField
                            name="message"
                            onChange={e => onTextChange(e)}
                            value={state.message}
                            id="outlined-multiline-static"
                            variant="outlined"
                            label="Write a message"
                            inputProps={{ style: { 
                                fontFamily: 'Inconsolata', 
                                color: 'white' }
                            }}
                            autoComplete="off"
                        />
                        {/* <div className="icon send" id="sentBtn" alt="Send Message" onClick={onMessageSubmit}>
                            <svg id="Capa_1" enable-background="new 0 0 512 512" height="512" viewBox="0 0 512 512" width="512" xmlns="http://www.w3.org/2000/svg"><g><path d="m502.978 58.481-208.557 42.743c-4.057.831-6.672 4.795-5.841 8.852s4.793 6.672 8.852 5.841l142.986-29.304-351.145 159.051-64.755-39.062c-15.29-9.226-11.298-32.432 6.201-36.022l238.506-48.881c4.057-.831 6.672-4.795 5.841-8.852-.832-4.057-4.797-6.672-8.852-5.841l-238.509 48.88c-30.905 6.34-37.948 47.258-10.936 63.558l65.223 39.346 33.832 188.689c.422 2.365 2.011 4.415 4.134 5.436 0 0 .001 0 .001.001 2.375.966 4.457 1.12 6.829-.172l145.508-79.141 66.004 39.822c18.364 11.068 42.61 2.985 50.287-17.483l122.918-327.479c2.095-5.507-2.788-11.158-8.527-9.982zm-320.732 260.79 75.167 45.352-119.479 64.985zm192.3 71.399c-4.312 11.498-18 16.237-28.498 9.909l-154.038-92.935 48.658-36.199c3.323-2.472 4.013-7.17 1.541-10.493-2.457-3.307-7.156-4.024-10.493-1.541l-57.621 42.867c-1.131.88-1.943 1.886-2.483 3.222l-45.632 113.626-28.793-160.582 346.888-157.122-188.536 140.265c-3.34 2.485-4.001 7.186-1.541 10.493 2.48 3.334 7.179 4.006 10.493 1.541l224.012-166.657z"/></g></svg>
                        </div> */}
                        <img id="sentBtn" src={Sent} alt="Send Message" onClick={onMessageSubmit}/>
                        </div>
                        {/* <button id="send-message">Send Message</button> */}
                    </form>
                </div>

            </div>
            
            <div id="peer-container">
                {peers.map((peer, index) => {
                    let id = "";
                    peersRef.current.forEach(ref => {
                        if(isEqual(ref['peer'], peer)){
                            id = ref['peerID'];
                            console.log(id);
                        }
                    })
                    return (
                        <Video key={index} ui={id} peer={peer}/>
                    );
                })}
            </div>
            <div id="footer">
                <p id="creators">Created by Dylan Finn, Emily Yu, and Zage Strassberg-Phillips</p>
                <p id="learn-more"><a id="learn-more-link" href="https://github.com/pocket-coders/castway-client">Click here to visit our Github page</a></p>
                <div id="meter"></div>
            </div>
        {/* </body> */}

        </div>
    );
};


export default Room;