import React from 'react';
import "./about.css"

const About = (props) => {
    return (
        <div id="about-section">   

            <div className="about-text-wrapper">
                <h1 id="us-header" className="about-header">About the Castway Team</h1>
                <p className="about-text">
                    <h4 className="section-header">Bios</h4>
                    <h4 className="section-header">Why we built this</h4>
                    <h4 className="section-header">Credits</h4>
                </p>
            </div>
            <br />
            <br />

            <div className="about-text-wrapper">
                <h1 id="project-header" className="about-header">About The Project</h1>
                <p className="about-text">
                    <h4 className="section-header">Why was Castway built?</h4>
                    Castway was built in the midst of the Covid-19 global pandemic to answer a need.
                    Seeing closed-source web-conferencing platforms continue to drop the ball time
                    and time again. This leaves the consumer in a precarious position, to trust their
                    data and meeting security to these black boxes, or reconsider how they approach remote conferencing
                    entirely.  Seeing this need   
                    
                    <br />
                    <br />
                    <h4 className="section-header">How is Castway different?</h4>
                    Castway is completely open-sourced and peer-to-peer.  It's also free to use,
                    and in the future we'll be rolling out new features for users to host their own servers
                    to encourage all sorts of use cases and make our platform as available as possible for free.
                    
                    <br />
                    <br />
                    <h4 className="section-header">How does it work?</h4>
                    To start, we should explain why our backend server (which you'll see referred to as a "signal server" for reasons 
                    that will obvious in a second) is necessary.  When 2 clients connect to each other through requesting a common room,
                    those clients first need to agree about how to talk to each other across the internet, including their own firewalls,
                    network rules, etc.  Normally clients (the users) connect to a server that is set up to accept requests.  However, since 
                    these clients can't talk to each other yet (for the same reason they need to "agree"), a server is needed to "signal" to
                    other clients when you want to connect and how.  
                    
                    <br />
                    <br />
                    Our entire system consists of an advanced client, for which each user has the code,
                    and a public signalling server clients connect to by default.  The servers exposing both of these services are secure
                    and encrypted, so that clients talking to each other do so through an SSL, or Secure Socket Layer.  Although the server itself
                    is closed off from public access, the functioning code is available on our Github (check out the code section below).
                </p>
            </div>
            <br />
            <br />
            <div className="about-text-wrapper">
                <h1 className="about-header">The Code</h1>
                <p className="about-text">
                    Castway's client server and code was built with React and JSX, while the signal
                    server was built in NodeJs.
                    <br />
                    <br />
                    If you want to see the code for yourself or contribute to the project, you can 
                    checkout us out on <a href="https://github.com/pocket-coders/castway-client">Github</a>.
                    This is also where you can our License for the source code.  
                </p>
            </div>
            <br />
            <br />
            <div className="about-text-wrapper">
                <h1 className="about-header">The Future</h1>
                <p className="about-text">
                    <h4 className="section-header">Next steps</h4>

                    <h4 className="section-header">Version 2</h4>

                    <h4 className="section-header">Ongoing Maintenance</h4>
                </p>
            </div>

            {/* <div className="animation-area">
                <ul className="box-area">
                    <li></li>
                    <li></li>
                    <li></li>
                    <li></li>
                    <li></li>
                    <li></li>
                </ul>
            </div> */}
        </div>
    );
}

export default About;
