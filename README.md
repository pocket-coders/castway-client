# [Castway](https://Castway.app)

An open-source web-conferencing platform for the remote work era

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

## Built With
* [NodeJS](https://nodejs.org/en/) - Web framework
* [React](https://reactsjs.org/) - Client Framework
* [Socket.io](https://socket.io/) - Socket Transport

## Deployed With
* [Docker](https://www.docker.com/) - Containerization and Cluster Fabrication
* [Digital Ocean](https://www.digitalocean.com/) - Cloud Server Hosting

---

### Authors
Dylan Finn | [Github](https://github.com/dy-fi/) | [LinkedIn](https://www.linkedin.com/in/dylan-finn-a36b9614b/) | [Portfolio](https://www.makeschool.com/portfolio/Dylan-Finn)

Zage Phillips | [Github](https://github.com/zphillips/) | [LinkedIn](https://www.linkedin.com/in/zage-strassberg-phillips-89299b186/)

Emily Yu | [Github](https://github.com/emilybelleyu/)

---
