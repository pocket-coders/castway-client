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
            <video controls id={props.key} className="peer-video" playsInline autoPlay ref={ref} />
            {/* <p id="username">Username</p> */}
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

    // horrible way to do this?
    let muteBool = true;
    function mute() {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
            const audioTrack = stream.getTracks()[0];

            // change this
            peersRef.current.forEach((p) => {
                if(muteBool) {
                    p.peer._pc.getSenders().find(sender => sender.track.kind === "audio").replaceTrack(null);
                    muteBool = false;

                    // return (
                    // );

                } else {
                    p.peer._pc.getSenders()[0].replaceTrack(audioTrack);
                    muteBool = true;

                    // return (
                    //     <p></p>
                    // );

                }
            })   
        })
    }

     // horrible way to do this?
     let videoBool = true;
     function camera() {
         navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
             const screenTrack = stream.getTracks()[1];
 
             peersRef.current.forEach((p) => {
                 if(muteBool) {
                     p.peer._pc.getSenders().find(sender => sender.track.kind === "video").replaceTrack(null);
                     muteBool = false;
                    //  userVideo.stream.srcObject = null;
                     // return (
                     // );
 
                 } else {
                     p.peer._pc.getSenders()[1].replaceTrack(screenTrack);
                     muteBool = true;
                    //  userVideo.stream.srcObject = stream;
                     // return (
                     //     <p></p>
                     // );
 
                 }
             })   
         })
     }

    return (
        // wrapping tag
        <body>
            <div id="user-header">
                <div id="meeting">
                    <p id="castway">Castway Meeting Room</p>
                </div>
                <div id="user-video-container">
                    <video controls id="user-video" muted ref={userVideo} autoPlay playsInline/>
                    {/* <button onClick={mute}>Mute</button> */}
                    <div className="icon sharescreen" onClick={shareScreen}>
                        <svg id="Capa_1" enable-background="new 0 0 512 512" height="512" viewBox="0 0 512 512" width="512" xmlns="http://www.w3.org/2000/svg">
                        <g id="Line_cutting_stoke_Expand"><g><path d="m464 376h-48v16h56c4.418 0 8-3.582 8-8v-40h-16z"/><path d="m384 376h16v16h-16z"/>
                        <path d="m464 312h16v16h-16z"/><path d="m48 120h16v-16h-24c-4.418 0-8 3.582-8 8v56h16z"/><path d="m80 104h16v16h-16z"/>
                        <path d="m32 184h16v16h-16z"/><path d="m480 240h-96v16h96v24h-96v16h104c4.418 0 8-3.582 8-8v-176h-16z"/>
                        <path d="m478 32h-348c-9.936.012-17.988 8.064-18 18v150h16v-150c0-1.105.895-2 2-2h348c1.105 0 2 .895 2 2v46h16v-46c-.012-9.936-8.064-17.988-18-18z"/>
                        <path d="m472 96v-24c0-4.418-3.582-8-8-8h-24v16h16v16z"/><path d="m48 234c0-1.105.895-2 2-2h300c1.105 0 2 .895 2 2v174h16v-174c-.012-9.936-8.064-17.988-18-18h-300c-9.936.012-17.988 8.064-18 18v174h16z"/>
                        <path d="m376 424h-128c-1.242 0-2.467.289-3.578.845l-14.311 7.155h-60.222l-14.311-7.155c-1.111-.556-2.336-.845-3.578-.845h-80v16h78.111l14.311 7.155c1.111.556 2.336.845 3.578.845h64c1.242 0 2.467-.289 3.578-.845l14.311-7.155h118.111v12c-.007 6.624-5.376 11.993-12 12h-312c-6.624-.007-11.993-5.376-12-12v-12h24v-16h-32c-4.418 0-8 3.582-8 8v20c.018 15.457 12.543 27.982 28 28h312c15.457-.018 27.982-12.543 28-28v-20c0-4.418-3.582-8-8-8z"/><path d="m344 408v-160c0-4.418-3.582-8-8-8h-48v16h40v152z"/><path d="m272 240h-208c-4.418 0-8 3.582-8 8v160h16v-152h200z"/>
                        <path d="m320 304v-24c0-4.418-3.582-8-8-8h-24v16h16v16z"/><path d="m80 376v24c0 4.418 3.582 8 8 8h24v-16h-16v-16z"/></g></g></svg>
                    </div>
                    <div className="icon muted" onClick={mute}>
                        {/* <svg id="Capa_1" enable-background="new 0 0 512 512" height="512" viewBox="0 0 512 512" width="512" xmlns="http://www.w3.org/2000/svg"><g><path d="m430.453 70.736c-81.402-78.405-198.224-90.066-289.578-42.741-6.927 3.588-11.593 10.393-12.481 18.204-.895 7.87 2.158 15.617 8.167 20.722l9.569 8.129c8.311 7.06 20.017 8.671 29.824 4.108 68.492-31.87 154.98-21.271 214.153 36.887 57.811 56.819 71.59 141.388 44.728 210.816-1.772 4.577-7.334 6.023-11.006 2.914l-65.046-55.082v-131.553c0-25.356-26.822-41.377-48.843-29.423l-86.069 46.733c-9.303-7.909-93.215-79.246-106.595-90.62-10.6-9.004-26.095-8.537-36.045 1.082-102.046 98.67-105.248 264.167-3.931 366.376 91.384 92.188 235.516 99.429 335.334 19.693 12.661-10.113 12.94-29.376.604-39.876l-7.327-6.237c-9.371-7.98-23.208-8.281-32.897-.72-74.297 57.952-181.126 54.042-251.261-15.754-70.856-70.515-75.946-179.773-18.658-256.048.617-.822 1.695-.968 2.445-.331l44.572 37.821c-17.975 5.134-31.189 21.832-31.189 41.596v77.077c0 23.839 19.215 43.233 42.833 43.233 16.861 1.262 30.494-3.421 48.182 6.186 15.899 8.632 89.183 48.422 100.002 54.297 22.088 11.992 48.842-4.146 48.842-29.422v-.001-15.896c11.196 9.553 48.54 41.417 58.259 49.709 15.959 13.585 40.165 9.969 51.479-7.713 64.279-100.44 52.363-237.066-38.067-324.166zm-91.669 72.404v114.618l-23.961-20.29v-103.645l4.663-2.532c8.856-4.809 19.298 1.828 19.298 11.849zm-98.538 31.174 54.577-29.633v75.849c-19.578-16.578-43.079-36.479-54.577-46.216zm-78.489 143.431c-12.59 0-22.833-10.424-22.833-23.236v-77.077c0-12.812 10.243-23.236 22.833-23.236h9.993l13.575 11.519v112.029h-23.568zm177.027 51.057c0 7.774-6.218 13.322-12.88 13.454-4.851.095-7.6-2.502-11.081-4.136v-62.516c2.901 2.462 23.546 19.98 23.961 20.332zm112.892 15.323c-4.78 7.468-14.893 9.03-21.67 3.263-.103-.087-149.104-126.953-142.48-121.177-4.212-3.574-10.521-3.056-14.095 1.153-3.574 4.21-3.058 10.52 1.153 14.093l20.238 17.174v68.629c-76.274-40.838-76.672-43.001-89.497-46.711v-97.862l7.762 6.587c4.832 4.101 12.202 2.724 15.244-2.821 2.238-4.077 1.382-9.299-2.303-12.425-4.624-3.924-106.906-90.716-107.546-91.259-9.498-8.059-23.84-6.466-31.378 3.568-63.077 83.979-57.645 204.423 20.541 282.231 77.717 77.342 195.935 81.101 277.671 17.347 2.28-1.779 5.418-1.704 7.631.18l7.327 6.237c2.778 2.365 2.705 6.767-.122 9.025-91.88 73.394-224.512 66.729-308.646-18.146-92.97-93.791-90.955-246.47 3.63-337.925 2.518-2.435 6.471-2.529 9.193-.217 52.49 44.598 173.772 147.639 306.575 259.966 14.142 11.977 35.862 6.417 42.584-10.958 29.673-76.695 14.312-169.714-49.359-232.293-64.368-63.264-159.575-76.601-236.613-40.757-2.75 1.28-6.061.801-8.437-1.218l-9.568-8.128c-1.899-1.613-1.636-4.79.564-5.931 84.453-43.748 191.876-32.49 266.503 39.389 83.555 80.478 94.238 206.569 35.098 298.986z"/><path d="m260.12 244.412c-1.843-4.491-6.662-6.899-11.19-5.979-5.573 1.132-8.903 6.485-7.85 11.758 1.152 5.565 6.48 8.912 11.76 7.849 6.22-1.262 9.684-7.855 7.28-13.628z"/></g></svg> */}
                        <svg height="416pt" viewBox="-55 0 416 416.238" width="416pt" xmlns="http://www.w3.org/2000/svg"><path d="m290.28125 27.679688-56.101562 56.097656v-4.816406c0-43.609376-35.351563-78.960938-78.960938-78.960938s-78.960938 35.351562-78.960938 78.960938v141.78125c.003907 6.300781.761719 12.578124 2.257813 18.699218l-25.140625 25.140625c-6.25-14.203125-9.464844-29.554687-9.433594-45.074219 0-5.523437-4.476562-10-10-10-5.519531 0-10 4.476563-10 10-.046875 20.886719 4.902344 41.484376 14.4375 60.070313l-35.300781 35.300781c-2.542969 2.523438-3.542969 6.210938-2.621094 9.675782.921875 3.460937 3.625 6.164062 7.085938 7.089843 3.464843.921875 7.15625-.078125 9.679687-2.625l31.96875-31.96875c3.988282 5.4375 8.386719 10.5625 13.15625 15.328125 21.5625 21.664063 50.058594 35.054688 80.5 37.824219v46.035156h-37.082031c-5.523437 0-10 4.476563-10 10 0 5.523438 4.476563 10 10 10h98.902344c5.523437 0 10-4.476562 10-10 0-5.523437-4.476563-10-10-10h-41.832031v-45.671875c69.464843-3.945312 123.746093-61.476562 123.65625-131.054687 0-5.523438-4.476563-10-10-10-5.523438 0-10 4.476562-10 10-.03125 45.007812-27.148438 85.570312-68.722657 102.796875-41.578125 17.226562-89.4375 7.730468-121.289062-24.0625-4.777344-4.777344-9.113281-9.976563-12.953125-15.53125l23.035156-23.035156c14.019531 24.71875 40.234375 40 68.652344 40.023437 43.539062 0 78.960937-35.636719 78.960937-79.441406v-108.195313l70.246094-70.246094c3.90625-3.90625 3.90625-10.238281 0-14.140624-3.90625-3.90625-10.238281-3.90625-14.140625 0zm-194.027344 193.066406v-141.78125c0-32.5625 26.398438-58.960938 58.960938-58.960938s58.960937 26.398438 58.960937 58.960938v24.816406l-117.902343 117.902344c0-.316406-.019532-.625-.019532-.9375zm117.921875-.480469c0 32.773437-26.449219 59.441406-58.960937 59.441406-23.234375-.027343-44.292969-13.679687-53.800782-34.878906l112.761719-112.761719zm0 0"/></svg>
                    </div>
                    <div className="icon camera" onClick={camera}>
                        <svg id="Capa_1" enable-background="new 0 0 512 512" height="512" viewBox="0 0 512 512" width="512" xmlns="http://www.w3.org/2000/svg"><g><path d="m508.306 214.116c-2.289-1.351-5.121-1.395-7.448-.114l-93.669 51.57v-17.97c0-19.041-15.491-34.532-34.532-34.532h-19.53c26.414-16.951 43.951-46.581 43.951-80.23 0-16.913-4.491-33.527-12.988-48.047-2.097-3.583-6.7-4.789-10.281-2.69-3.582 2.096-4.786 6.699-2.69 10.281 7.151 12.219 10.93 26.209 10.93 40.457 0 44.239-35.991 80.23-80.23 80.23s-80.23-35.991-80.23-80.23 35.991-80.231 80.23-80.231c18.841 0 37.15 6.66 51.553 18.754 3.18 2.669 7.918 2.257 10.587-.924 2.669-3.178 2.256-7.918-.923-10.587-17.107-14.363-38.847-22.273-61.217-22.273-46.522 0-85.35 33.526-93.622 77.684-12.668-15.371-31.844-25.188-53.272-25.188-38.053 0-69.011 30.959-69.011 69.012 0 21.84 10.209 41.329 26.093 53.984-19.023.021-34.493 15.503-34.493 34.531v1.217h-30.596l-36.183-17.141c-4.765-2.431-10.89 1.445-10.732 6.791v93.253c-.161 5.348 5.975 9.223 10.732 6.792l36.183-17.141h30.597v118.511c0 19.042 15.491 34.533 34.532 34.533h195.676c4.15 0 7.515-3.364 7.515-7.515s-3.364-7.515-7.515-7.515h-195.676c-10.754 0-19.503-8.749-19.503-19.504v-192.281c0-10.754 8.749-19.503 19.503-19.503h260.61c10.754 0 19.503 8.748 19.503 19.503v192.283c0 10.754-8.749 19.504-19.503 19.504h-34.876c-4.15 0-7.515 3.364-7.515 7.515s3.364 7.515 7.515 7.515h34.876c19.041 0 34.532-15.491 34.532-34.533v-59.647l93.669 51.57c4.77 2.821 11.31-1.043 11.139-6.583v-204.641c0-2.658-1.404-5.118-3.691-6.47zm-493.274 36.229 22.68 10.745v48.015l-22.68 10.745zm37.71 56.001v-42.497h24.773v42.497zm48.201-147.258c0-29.766 24.216-53.983 53.982-53.983s53.983 24.217 53.983 53.983-24.216 53.983-53.983 53.983c-29.765 0-53.982-24.217-53.982-53.983zm96.902 53.983c10.117-8.06 17.922-18.892 22.259-31.344 7.591 12.641 18.019 23.391 30.413 31.344zm299.123 199.441-89.778-49.429v-80.353l89.778-49.429z"/><path d="m263.508 132.841c0 21.125 17.186 38.311 38.311 38.311 21.124 0 38.311-17.186 38.311-38.311s-17.186-38.311-38.311-38.311-38.311 17.186-38.311 38.311zm61.592 0c0 12.837-10.444 23.281-23.281 23.281-12.838 0-23.282-10.444-23.282-23.281s10.444-23.282 23.282-23.282c12.837.001 23.281 10.445 23.281 23.282z"/><path d="m154.925 186.162c14.929 0 27.074-12.146 27.074-27.074s-12.145-27.073-27.074-27.073c-14.928 0-27.074 12.145-27.074 27.073.001 14.929 12.146 27.074 27.074 27.074zm0-39.118c6.642 0 12.045 5.403 12.045 12.044 0 6.642-5.403 12.045-12.045 12.045-6.641 0-12.044-5.403-12.044-12.045 0-6.641 5.403-12.044 12.044-12.044z"/><path d="m330.267 363.344v-81.979c0-9.668-7.866-17.534-17.534-17.534h-81.281c-4.15 0-7.515 3.364-7.515 7.515s3.364 7.515 7.515 7.515h81.281c1.381 0 2.505 1.123 2.505 2.505v81.979c0 1.382-1.124 2.505-2.505 2.505h-140.762c-1.381 0-2.505-1.123-2.505-2.505v-81.979c0-1.382 1.124-2.505 2.505-2.505h29.423c4.15 0 7.515-3.364 7.515-7.515s-3.364-7.515-7.515-7.515h-29.423c-9.668 0-17.534 7.866-17.534 17.534v81.979c0 9.668 7.866 17.534 17.534 17.534h140.762c9.668 0 17.534-7.866 17.534-17.534z"/><path d="m282.778 406.998c-4.15 0-7.514 3.364-7.514 7.515s3.364 7.515 7.514 7.515h18.745c4.15 0 7.515-3.364 7.515-7.515s-3.364-7.515-7.515-7.515z"/><path d="m232.979 406.998c-4.15 0-7.515 3.364-7.515 7.515s3.364 7.515 7.515 7.515h18.746c4.15 0 7.515-3.364 7.515-7.515s-3.364-7.515-7.515-7.515z"/><path d="m183.179 406.998c-4.15 0-7.515 3.364-7.515 7.515s3.365 7.515 7.515 7.515h18.746c4.15 0 7.515-3.364 7.515-7.515s-3.364-7.515-7.515-7.515z"/></g></svg>
                    </div>
                    {/* <div>Icons made by <a href="https://www.flaticon.com/authors/pixel-perfect" title="Pixel perfect">Pixel perfect</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div> */}
                </div>
            </div>
            <div id="peer-container">
                {peers.map((peer, index) => {
                    return (
                        <Video key={index} peer={peer} />
                    );
                })}
            </div>
            <div id="footer">
                <p id="creators">Created by Dylan Finn, Emily Yu, and Zage Strassberg-Phillips</p>
                <p id="learn-more">Wanna learn more about us? <a id="learn-more-link">Click here.</a></p>
            </div>
        </body>
    );
};

export default Room;