import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';

import './CreateAccount.css';

class CreateAccountPage extends Component {
    state = {
        errMessage: null,
        successMessage: null
    };

    constructor(props) {
        super(props);
        this.nameEl = React.createRef();
        this.usernameEl = React.createRef();
        this.passwordEl = React.createRef();
        this.emailEl = React.createRef();
    }

    submitHandler = (event) => {
        event.preventDefault();
        const name = this.nameEl.current.value;
        const username = this.usernameEl.current.value;
        const password = this.passwordEl.current.value;
        const email = this.emailEl.current.value;

        if (name.trim().length === 0 || username.trim().length === 0 || password.trim().length === 0 || email.trim().length === 0) {
            return;
        }

        const requestBody = {
            query: `
                mutation CreateUser($name: String!, $username: String!, $password: String!, $email: String!) {
                    createUser(userInput: {name: $name, username: $username, password: $password, email: $email}) {
                        _id
                        username
                    }
                }
            `,
            variables: {
                name: name,
                username: username,
                password: password,
                email: email
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
                throw new Error('Failed!');
            }
            return res.json();
        }).then(resData => {
            if (resData.errors) {
                this.setState({ errMessage: resData.errors[0].message, successMessage: null });
            }
            else {
                this.clearInputs();
            }
        }).catch(err => {
            console.log(err);
        });
    };

    clearInputs = () => {
        this.nameEl.current.value = "";
        this.usernameEl.current.value = "";
        this.passwordEl.current.value = "";
        this.emailEl.current.value = "";

        this.setState({successMessage: "Account created successfully", errMessage: null});
    }

    render() {
        return <form className="createAccount-form" onSubmit={this.submitHandler}>
            <h1 className="title2">CREATE ACCOUNT</h1>
            <div className="content-form">
                <div className="form-controll" data-validate="Name is required.">
                    <input type="text" id="name" placeholder="Name" ref={this.nameEl} required />
                    <span className="focus-input"></span>
                </div>
                <div className="form-controll" data-validate="Username is required.">
                    <input type="text" id="username" placeholder="Username" ref={this.usernameEl} required />
                    <span className="focus-input"></span>
                </div>
                <br />
                <div className="form-controll" data-validate="Password is required.">
                    <input type="password" id="password" placeholder="Password" ref={this.passwordEl} required />
                    <span className="focus-input"></span>
                </div>
                <div className="form-controll" data-validate="Email is required.">
                    <input type="email" id="email" placeholder="Email" ref={this.emailEl} required />
                    <span className="focus-input"></span>
                </div>
                {this.state.errMessage && (
                    <div className="div-errMessage">
                        {this.state.errMessage}
                    </div>
                )}
                {this.state.successMessage && (
                    <div className="div-successMessage">
                        {this.state.successMessage}
                    </div>
                )}
                <div className="form-actions">
                    <button type="submit">SIGN UP</button>
                </div>
                <div className="div-signIn">
                    <span>Have an account?</span>
                    <NavLink to="/auth">SIGN IN NOW</NavLink>
                </div>
            </div>

        </form>;
    }
}

export default CreateAccountPage;