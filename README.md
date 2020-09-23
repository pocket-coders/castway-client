# [Castway 1.0.0](https://Castway.app)

An open-source web-conferencing platform for the remote work era

Castway is an alternative peer to peer solution for video calling across the internet.  We set out to build Castway so that the server **isn't needed after the initial connection**. After seeing more private platforms lose the trust of users after security issues, it was obvious there has to be a better way.  

After clients use our backend server to agree on firewall settings and things like that, the proceeding call is a direct socket connection between the browser clients. Our open-sourced nature allows us to prove this directly through our code.  

-----

## Running Locally
Make sure you have [Node.js](http://nodejs.org/) and [React](https://reactjs.org) installed.  

*The signal server URL is changed via
changing the value of the signal constant on line 20 of
`/src/routes/room.js`

### With Node
```sh
git clone https://github.com/pocket-coders/Castway-Client
cd Castway-Client
npm install
npm start
cd signal
node server.js
```
By default the app runs on [localhost:3000](http://localhost:3000/).

###  With Docker
Make sure you have [Docker](https://www.docker.com/) installed

```sh
git clone https://github.com/pocket-coders/Castway-Client
cd Castway
docker-compose up --build
```
Port 3000 is exposed in the Dockerfile and mapped to port 80 (HTTP) in the docker-compose file.  

You can remap ports with `docker-compose up -p <host>:<target>`

---

## Modules

Castway was designed with a distinct and modular separation between the backend and client.  The Castway team is developing an enterprise solution to give companies the ability to run Castway using their own servers.  

---

## Built With
* [NodeJS](https://nodejs.org/en/) - Web framework
* [React](https://reactsjs.org/) - Client Framework
* [Socket.io](https://socket.io/) - Socket Transport
* [WebRTC](https://webrtc.org/) - P2P Video Streaming Framework 

## Deployed With
* [Docker](https://www.docker.com/) - Containerization and Cluster Fabrication
* [Digital Ocean](https://www.digitalocean.com/) - Cloud Server Hosting

---

### Authors
Dylan Finn | [Github](https://github.com/dy-fi/) | [LinkedIn](https://www.linkedin.com/in/dylan-finn-a36b9614b/) | [Site](https://dylanfinn.dev)

Zage Phillips | [Github](https://github.com/zphillips/) | [LinkedIn](https://www.linkedin.com/in/zage-strassberg-phillips-89299b186/)

Emily Yu | [Github](https://github.com/emilybelleyu/)

---

### Maintenance, Questions, or Concerns
 
Contact:

Dylan Finn - dylanfinn89@gmail.com

Michael Lorton - mlorton@outschool.com