import React from "react";
import "../styles.css";

const HeroBanner = (props) => {
    return (
        <div>
            <div className="banner">
                <h1 id="castway-hero">Castway~</h1>
            </div>
            <div className="subline">
                <h3 id="subtitle">
                    A web-conferencing app for the remote work era
                </h3> 
            </div>
        </div>
    );
}

export default HeroBanner;