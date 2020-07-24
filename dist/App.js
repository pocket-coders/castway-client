"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importDefault(require("react"));
var react_router_dom_1 = require("react-router-dom");
var CreateRoom_1 = __importDefault(require("./components/routes/CreateRoom"));
var Room_1 = __importDefault(require("./components/routes/Room"));
require("./App.css");
function App() {
    return (react_1.default.createElement("div", { className: "App" },
        react_1.default.createElement(react_router_dom_1.BrowserRouter, null,
            react_1.default.createElement(react_router_dom_1.Switch, null,
                react_1.default.createElement(react_router_dom_1.Route, { path: "/", exact: true, component: CreateRoom_1.default }),
                react_1.default.createElement(react_router_dom_1.Route, { path: "/room/:roomID", component: Room_1.default })))));
}
exports.default = App;
//# sourceMappingURL=App.js.map