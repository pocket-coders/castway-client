// First screen client gets, creates a new room

import React from "react";
import { BrowserRouter, Link } from 'react-router-dom';
import shortid from "shortid";
import "./styles.css"

const CreateRoom = (props) => {
    function create() {
        // generate unique identifier
        const id = shortid.generate();
        // navigate over to the room
        props.history.push(`/room/${id}`);
    }

    return (
        <div>
            <div class="banner">
                <h1 id="castway-hero">Castway~</h1>
            </div>
            <div id="action-body">
                <a id="create-meeting" onClick={create}>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    Create Meeting room
                </a>
            </div>
            <div className="animation-area">
                <ul className="box-area">
                    <li></li>
                    <li></li>
                    <li></li>
                    <li></li>
                    <li></li>
                    <li></li>
                </ul>
            </div>
            <div class="navbar">
                <Link to="/about/us" className="index-link">The Team</Link>
                <Link to="/about/project" className="index-link">The Project</Link>
                <Link to="/about/code" className="index-link">The Code</Link>
                <Link to="/about/future" className="index-link">The Future</Link>
            </div>
        </div>
    );
}

export default CreateRoom;