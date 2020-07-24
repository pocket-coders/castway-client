// First screen client gets, creates a new room

import React from "react";
import shortid from "shortid";
import "./styles.css"

const CreateRoom = (props: any) => {
    function create() {
        // generate unique identifier
        const id = shortid.generate();
        // navigate over to the room
        props.history.push(`/room/${id}`);
    }

    return (
        <div id="room-button" onClick={create}>
            <h2 id="create">Create Meeting Room</h2>
        </div>
    );
}

export default CreateRoom;