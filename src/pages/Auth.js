import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';

import './Auth.css';
import AuthContext from '../context/auth-context';

class AuthPage extends Component {
    state = {
        errMessage: null
    };

    static contextType = AuthContext;

    constructor(props) {
        super(props);
        this.usernameEl = React.createRef();
        this.passwordEl = React.createRef();
    }

    submitHandler = (event) => {
        event.preventDefault();
        const username = this.usernameEl.current.value;
        const password = this.passwordEl.current.value;

        if (username.trim().length === 0 || password.trim().length === 0) {
            return;
        }

        const requestBody = {
            query: `
                query Login($username: String!, $password: String!) {
                    login(username: $username, password: $password) {
                        userId
                        token
                        tokenExpiration
                    }
                }
            `,
            variables: {
                username: username,
                password: password
            }
        };

        fetch(`${this.context.webservice}graphql`, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(res => {
            if (res.status !== 200 && res.status !== 201) {
                throw new Error('Incorrect username or password.');
            }
            return res.json();
        }).then(resData => {
            if (resData.data.login.token) {
                this.context.login(resData.data.login.token, resData.data.login.userId, resData.data.login.tokenExpiration);
            }
        }).catch(err => {
            this.setState({ errMessage: err.message });
        });
    };

    render() {
        return (
            <form className="auth-form" onSubmit={this.submitHandler}>
                <h1 className="title2">ACCOUNT LOGIN</h1>
                <div className="content-form">
                    <div className="form-controll" data-validate="Username is required.">
                        <input type="text" id="username" placeholder="Username" ref={this.usernameEl} required />
                        <span className="focus-input"></span>
                    </div>
                    <div className="form-controll" data-validate="Password is required.">
                        <input type="password" id="password" placeholder="Password" ref={this.passwordEl} required />
                        <span className="focus-input"></span>
                    </div>
                    {this.state.errMessage && (
                        <div className="div-errMessage">
                            {this.state.errMessage}
                        </div>
                    )}
                    <div className="div-forgot">
                        <span>Forgot </span>
                        <NavLink to="/auth">Username / Password?</NavLink>
                    </div>
                    <div className="form-actions">
                        <button type="submit">SIGN IN</button>
                    </div>
                    <div className="div-createAccount">
                        <span>Don't have an account?</span>
                        <NavLink to="/createAccount">SIGN UP NOW</NavLink>
                    </div>
                </div>
            </form>
        );
    }
}

export default AuthPage;