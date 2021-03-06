import React from 'react';
import { BrowserRouter, Route, Switch } from "react-router-dom";
import CreateRoom from "./components/routes/CreateRoom";
import Room from "./components/routes/Room";
import About from "./components/routes/About/about.js";
import './App.css'; 

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Switch>
          <Route path="/" exact component={CreateRoom} />
          <Route path="/room/:roomID" component={Room} />
          <Route path="/about" component={About} />           
        </Switch>
      </BrowserRouter>
    </div>
  );
}

export default App;