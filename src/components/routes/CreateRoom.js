// First screen client gets, creates a new room

import React from "react";
import shortid from "shortid";

const CreateRoom = (props) => {
    function create() {
        // generate unique identifier
        const id = shortid.generate();
        // navigate over to the room
        props.history.push(`/room/${id}`);
    }

    return (
        <button onClick={create}>Create Room</button>
    );
}

export default CreateRoom;