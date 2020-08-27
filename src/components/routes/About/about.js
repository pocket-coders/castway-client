import React from 'react';
import "./about.css";

import github from "../../images/about/github.png";
import linkedin from "../../images/about/linkedin.png";
import person from "../../images/about/person.png";

const About = (props) => {
    return (
        <div id="about-section">   

            <div className="about-text-wrapper">
                <h1 id="us-header" className="about-header">About the Castway Team</h1>
                <p className="about-text">
                    <a className="section-header">Dylan - Full Stack Engineer, DevOps Lead, Backend Lead</a>
                    <br />
                    <br />
                    Dylan was the type to take apart electronics when he was younger, leading to a passion
                    for building in adulthood and has launched many projects individually and as part of a team.
                    When he's not tinkering with something, Dylan likes to sail, rock climb, and read.
                    
                    <br />
                    <br />
                    <a href="https://github.com/dy-fi">
                        <img src={github} alt="Problem loading" className="social-link-icon"/>
                    </a>
                    <a href="https://www.linkedin.com/in/dylan-finn-a36b9614b/">
                        <img src={linkedin} alt="Problem loading" className="social-link-icon"/>
                    </a>
                    <a href="https://dylanfinn.dev">
                        <img src={person} alt="Problem loading" className="social-link-icon" />
                    </a>

                    <br />
                    <br />
                    <a className="section-header">Emily - Full Stack Engineer, Design</a>
                    <br />
                    <br />
                    An avid programmer, Emily enjoys iOS Development and Web Development. When she is not coding, 
                    she plays with her two cats, Mochi and Yuki, and loves to play games like Stardew Valley or 
                    Animal Crossing when she has free time.

                    <br />
                    <br />
                    <a href="https://github.com/emilybelleyu">
                        <img src={github} alt="Problem loading" className="social-link-icon"/>
                    </a>
                    <a href="https://www.linkedin.com/in/emily-yu-074a5a1b0/">
                        <img src={linkedin} alt="Problem loading" className="social-link-icon"/>
                    </a>

                    <br />
                    <br />
                    <a className="section-header">Zage - Full Stack Engineer, Design</a>
                    <br />
                    <br />
                    Zage is a sophomore at the University of Washington studying Computer Engineering. 
                    She is a passionate programmer who enjoys web development and has recently sparked 
                    an interest in cybersecurity. In her free time, she loves to paint, solve puzzles, 
                    and watch movies with her friends and family.

                    <br />
                    <br />
                    <a href="https://github.com/zphillips">
                        <img src={github} alt="Problem loading" className="social-link-icon"/>
                    </a>
                    <a href="https://www.linkedin.com/in/zage-strassberg-phillips-89299b186/">
                        <img src={linkedin} alt="Problem loading" className="social-link-icon"/>
                    </a>
                    <br />
                    <br />
                    <a className="section-header">Credits</a>
                    <br />
                    We would like to thank Michael Lorton for his continued help and support in multiple
                    ways throughout the project!  
                </p>
            </div>
            <br />
            <br />

            <div className="about-text-wrapper">
                <h1 id="project-header" className="about-header">About The Project</h1>
                <p className="about-text">

                    <a className="section-header">Why was Castway built?</a>
                    <br />
                    <br />

                    Castway was built in the midst of the Covid-19 global pandemic to answer a need.
                    Seeing closed-source web-conferencing platforms continue to drop the ball time
                    and time again leaving the consumer in a precarious position, to trust their
                    data and meeting security to these black box applications, or reconsider how they approach remote conferencing
                    entirely.  Castway wants to put web-conferencing in the hands of the people and
                    create a solution users can be confident in.  
                    
                    <br />
                    <br />
                    <a className="section-header">How is Castway different and better?</a>
                    <br />
                    <br />
                    Castway is completely open-sourced and peer-to-peer.  It's also free to use,
                    and in the future we'll be rolling out new features for users to host their own servers
                    to encourage all sorts of use cases and make our platform as available as possible for free.
                    
                    <br />
                    <br />
                    We go into more detail in other parts of this page about our security, but as the main concern of
                    modern web-conferencing is security (and we've recently seen other companies drop the ball), we thought 
                    it was worth mentioning that all communications are encrypted through SSL, but as this is a peer-to-peer
                    application, we still ask users to only connect to sources they trust.  
                    
                    <br />
                    <br />
                    <a className="section-header">How does it work?</a>
                    <br />
                    <br />
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
                <h1 className="about-header"><a id="code-header">The Code</a></h1>
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
                <h1 id="future-header" className="about-header">The Future</h1>
                <p className="about-text">
                    <a className="section-header">Next steps</a>
                    <br />
                    <br />
                    For now the Castway team is focused on improving the user experience, performance, and scaling
                    of the current build instead of adding new features, but we do have some
                    awesome additions to the site planned. 
                    
                    <br />
                    <br />
                    <a className="section-header">Version 2</a>
                    <br />
                    <br />
                    As mentioned in the last section, right now we are focused on delivering the best
                    user experience with our current build, making the most solid foundation possible
                    for the next iterations.  We will release roadmap updates through Github.  

                    <br />
                    <br />
                    <a className="section-header">Ongoing Maintenance</a>
                    <br /> 
                    <br />
                    This application is still a work in progress, and as such might require maintenance
                    that requires the site to go down (unless something is seriously wrong, this should never be
                    more than 10 minutes per week).  We are and will continue to actively maintain and monitor the
                    site.

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
