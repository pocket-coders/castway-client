// First screen client gets, creates a new room

import React from "react";
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
            <div id="action-body">
                <a id="create-meeting" href="# " onClick={create}>
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
        </div>
    );
}

export default CreateRoom;