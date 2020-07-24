"use strict";
// First screen client gets, creates a new room
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importDefault(require("react"));
var shortid_1 = __importDefault(require("shortid"));
var CreateRoom = function (props) {
    function create() {
        // generate unique identifier
        var id = shortid_1.default.generate();
        // navigate over to the room
        props.history.push("/room/" + id);
    }
    return (react_1.default.createElement("button", { onClick: create }, "Create Room"));
};
exports.default = CreateRoom;
//# sourceMappingURL=CreateRoom.js.map