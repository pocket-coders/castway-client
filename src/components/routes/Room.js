import React, { useState, useEffect, useRef } from 'react';
import styled from "styled-components";
import io from "socket.io-client";

//style components for the message chat box
const Page = styled.div`
  display: flex;
  height: 200vh;
  width: 100%;
  align-items: center;
  background-color: #46516e;
  flex-direction: column;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 500px;
  max-height: 500px;
  overflow: auto;
  width: 400px;
  border: 1px solid lightgray;
  border-radius: 10px;
  padding-bottom: 10px;
  margin-top: 25px;
`;

const TextArea = styled.textarea`
  width: 98%;
  height: 100px;
  border-radius: 10px;
  margin-top: 10px;
  padding-left: 10px;
  padding-top: 10px;
  font-size: 17px;
  background-color: transparent;
  border: 1px solid lightgray;
  outline: none;
  color: lightgray;
  letter-spacing: 1px;
  line-height: 20px;
  ::placeholder {
    color: lightgray;
  }
`;

const Button = styled.button`
  background-color: pink;
  width: 100%;
  border: none;
  height: 50px;
  border-radius: 10px;
  color: #46516e;
  font-size: 17px;
`;

const Form = styled.form`
  width: 400px;
`;

const MyRow = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
`;

const MyMessage = styled.div`
  width: 45%;
  background-color: pink;
  color: #46516e;
  padding: 10px;
  margin-right: 5px;
  text-align: center;
  border-top-right-radius: 10%;
  border-bottom-right-radius: 10%;
`;

const PartnerRow = styled(MyRow)`
  justify-content: flex-start;
`;

const PartnerMessage = styled.div`
  width: 45%;
  background-color: transparent;
  color: lightgray;
  border: 1px solid lightgray;
  padding: 10px;
  margin-left: 5px;
  text-align: center;
  border-top-left-radius: 10%;
  border-bottom-left-radius: 10%;
`;

const Room = (props) => {
    /*---------------------VIDEO CHAT CONSTANTS----------------------------*/
    const userVideo = useRef();
    const partnerVideo = useRef();
    const peerRef = useRef();
    const socketRef = useRef();
    const otherUser = useRef();
    const userStream = useRef();

    /*---------------------SHARESCREEN CONSTANTS----------------------------*/
    const senders = useRef([]);

    /*---------------------MESSAGE CHAT FUNCTIONS----------------------------*/
    //keep track of your id
    const [yourID, setYourID] = useState();
    //array of messages
    const [messages, setMessages] = useState([]);
    //individual message tied to the message box
    const [message, setMessage] = useState("");

  
    useEffect(() => {

        /*---------------------VIDEO CHAT----------------------------*/
        navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(stream => {
            userVideo.current.srcObject = stream;
            userStream.current = stream;

            socketRef.current = io.connect("/");
            socketRef.current.emit("join room", props.match.params.roomID);

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

            /*---------------------MSG CHAT----------------------------*/
            //listen to the event for when you are connecting, in return the server sends to the client your own id,
            //so the server can keep track of who you are
            socketRef.current.on("your id", id => {
              setYourID(id);
            })
      
            //client is sending an event back to the client, server responds with the message event
            //sends in the message body
            socketRef.current.on("message", (message) => {
              console.log("here");
              receivedMessage(message);
            })
        });

    }, []);

/*---------------------MSG CHAT FUNCTIONS----------------------------*/
    //receives a message oject and appends it to state
    function receivedMessage(message) {
      setMessages(oldMsgs => [...oldMsgs, message]);
    }

    function sendMessage(e) {
      e.preventDefault();
      //your actual id and renders your message
      const messageObject = {
        body: message,
        id: yourID,
      };
      setMessage("");
      //send message object down to server
      socketRef.current.emit("send message", messageObject);
    }

    function handleChange(e) {
      setMessage(e.target.value);
    }


/*---------------------VIDEO CHAT FUNCTIONS----------------------------*/
    function callUser(userID) {
        peerRef.current = createPeer(userID); 
        //userStream represents the stream that contains your audio and video tracks
        //take the tracks and put it into the senders array
        userStream.current.getTracks().forEach(track => senders.current.push(peerRef.current.addTrack(track, userStream.current)));
    }

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
        peer.ontrack = handleTrackEvent;
        peer.onnegotiationneeded = () => handleNegotiationNeededEvent(userID);

        return peer;
    }

    function handleNegotiationNeededEvent(userID) {
        peerRef.current.createOffer().then(offer => {
            return peerRef.current.setLocalDescription(offer);
        }).then(() => {
            const payload = {
                target: userID,
                caller: socketRef.current.id,
                sdp: peerRef.current.localDescription
            };
            socketRef.current.emit("offer", payload);
        }).catch(e => console.log(e));
    }

    function handleRecieveCall(incoming) {
        peerRef.current = createPeer();
        const desc = new RTCSessionDescription(incoming.sdp);
        peerRef.current.setRemoteDescription(desc).then(() => {
            userStream.current.getTracks().forEach(track => peerRef.current.addTrack(track, userStream.current));
        }).then(() => {
            return peerRef.current.createAnswer();
        }).then(answer => {
            return peerRef.current.setLocalDescription(answer);
        }).then(() => {
            const payload = {
                target: incoming.caller,
                caller: socketRef.current.id,
                sdp: peerRef.current.localDescription
            }
            socketRef.current.emit("answer", payload);
        })
    }

    function handleAnswer(message) {
        const desc = new RTCSessionDescription(message.sdp);
        peerRef.current.setRemoteDescription(desc).catch(e => console.log(e));
    }

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

    /*---------------------SHARESCREEN FUNCTIONS----------------------------*/
    function shareScreen() {
      //get displayMedia and also track the cursor
        navigator.mediaDevices.getDisplayMedia({ cursor: true }).then(stream => {
            const screenTrack = stream.getTracks()[0];
            //do a find over the current array of senders and find the one with a track of type video, and replace that one with the
            //current screenTrack
            senders.current.find(sender => sender.track.kind === 'video').replaceTrack(screenTrack);
            //whenever screenTrack is no longer being used, this onended event is raised
            screenTrack.onended = function() {
                //basically replaces the screen with your face once you stop screensharing
                senders.current.find(sender => sender.track.kind === "video").replaceTrack(userStream.current.getTracks()[1]);
            }
        })
    }

    return (
      /* - renders the page component, the all encompassing component
         - the container component houses all the actual messages
         - messages.maps iterates over the message array and uses logic to determine whether to
          show your message or the other peer's msg 
         - form will have an onSubmit which will call the sendMessage
      */
        <Page>
          <div>
            <video controls style={{height: 500, width: 500}} autoPlay ref={userVideo} />
            <video controls style={{height: 500, width: 500}} autoPlay ref={partnerVideo} />
            <button onClick={shareScreen}>Share screen</button>
          </div>
        <Container>
          {messages.map((message, index) => {
            if (message.id === yourID) {
              return (
                <MyRow key={index}>
                  <MyMessage>
                    {message.body}
                  </MyMessage>
                </MyRow>
              )
            }
              return (
                <PartnerRow key={index}>
                  <PartnerMessage>
                    {message.body}
                  </PartnerMessage>
                </PartnerRow>
              )
            })}
          </Container>
            <Form onSubmit={sendMessage}>
              <TextArea value={message} onChange={handleChange} placeholder="Say something..." />
              <Button>Send</Button>
            </Form>
         </Page>
    );
};

export default Room;
