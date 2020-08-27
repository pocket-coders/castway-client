// First screen client gets, creates a new room

import React from "react";
import { Link } from 'react-router-dom';
import shortid from "shortid";
import "./styles.css";

import heart from '../images/about/heart.png';
import laptop from '../images/about/laptop.png';
import code from '../images/about/code.png';
import future from '../images/about/future.png';

const CreateRoom = (props) => {
    function create() {
        // generate unique identifier
        const id = shortid.generate();
        // navigate over to the room
        props.history.push(`/room/${id}`);
    }

    return (
        <div id="landing">
            <div className="banner-wrapper">
                <div class="banner">
                    <h1 id="castway-hero">Castway~</h1>
                </div>
                <div class="subline">
                    <h3 id="subtitle">
                        A web-conferencing app for the remote work era
                    </h3>
                </div>
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
            <div className="navbar">
                <div className="link-wrapper">
                    <Link to="/about#us-header" className="index-link">
                        <img src={heart} className="link-img"></img>
                        <br></br>
                        The Team
                    </Link>
                </div>
                <div className="link-wrapper">
                    <Link to="/about#project-header" className="index-link">
                        <img src={laptop} className="link-img"></img>
                        <br></br>
                        The Project
                    </Link>
                </div>                
                <div className="link-wrapper">
                    <Link to="/about#code-header" className="index-link">
                        <img src={code} className="link-img"></img>
                        <br></br>
                        The Code
                    </Link>
                </div>
                <div className="link-wrapper">
                    <Link to="/about#future-header" className="index-link">
                        <img src={future} className="link-img"></img>
                        <br></br>
                        The Future
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default CreateRoom;