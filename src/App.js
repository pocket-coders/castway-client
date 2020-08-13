import React from 'react';
import { BrowserRouter, Route, Switch } from "react-router-dom";
import CreateRoom from "./components/routes/CreateRoom";
import Room from "./components/routes/Room";
import AboutUs from "./components/routes/About/about_us";
import AboutProject from "./components/routes/About/about_project";
import AboutCode from "./components/routes/About/about_code";
import AboutFuture from "./components/routes/About/about_future";
import './App.css'; 

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Switch>
          <Route path="/" exact component={CreateRoom} />
          <Route path="/room/:roomID" component={Room} />
          <Route exact path="/about/us" component={AboutUs}/>
          <Route exact path="/about/project" component={AboutProject}/>
          <Route exact path="/about/code" component={AboutCode}/>
          <Route exact path="/about/future" component={AboutFuture}/>           
        </Switch>
      </BrowserRouter>
    </div>
  );
}

export default App;