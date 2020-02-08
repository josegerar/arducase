import React from 'react';
import { NavLink } from 'react-router-dom';

import AuthContext from '../../context/auth-context';
import './MainNavigation.css';

const mainNavigation = props => (
    <AuthContext.Consumer>
        {(context) => {
            return (
                <header className="mainBar">
                    <div className="logoNamePanel">
                        <div className="logo"></div>
                        <div className="title">
                            ArduCase
                </div>
                    </div>
                    <nav className="optionsPanel">
                        <ul>
                            {context.token && (
                                <React.Fragment>
                                    <li>
                                        <NavLink to="/projects">Projects</NavLink>
                                    </li>
                                    <li className="li-logout">
                                        <button onClick={context.logout}>Logout</button>
                                    </li>
                                </React.Fragment>
                            )}
                            {!context.token && (
                                <li>
                                    <NavLink to="/auth">Sign In</NavLink>
                                </li>
                            )}
                        </ul>
                    </nav>
                </header>
            )
        }}
    </AuthContext.Consumer>
)

export default mainNavigation;