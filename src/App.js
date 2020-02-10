import React, { Component } from 'react';
import { BrowserRouter, Route, Redirect, Switch } from 'react-router-dom';

import AuthPage from './pages/Auth';
import ProjectsPage from './pages/Projects';
import EditorPage from './pages/Editor';
import CreateAccountPage from './pages/CreateAccount';
import MainNavigation from './components/Navigation/MainNavigation';
import AuthContext from './context/auth-context';

import './App.css';

class App extends Component {
  state = {
    token: null,
    userId: null,
    webservice: "http://localhost:8000/"
  };

  componentDidMount() {
    this.verifyUser();
  }

  verifyUser = () => {
    const tokenTemp = localStorage.getItem("TOKEN");
    if (tokenTemp) {
      fetch(this.state.webservice, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + tokenTemp }
      }).then(res => {
        return res.json();
      }).then(resData => {
        if (resData && resData.token) {
          let payload;
          payload = resData.token.split('.')[1];
          payload = window.atob(payload);
          payload = JSON.parse(payload);
          this.setState({
            token: resData.token,
            userId: payload.userId
          });
        } else {
          this.logout();
        }
      }).catch(err => {
        console.log(err);
        this.logout();
      });
    }
  }

  login = (token, userId, tokenExpiration) => {
    localStorage.setItem("TOKEN", token);
    this.setState({ token: token, userId: userId });
  };

  logout = () => {
    this.setState({ token: null, userId: null });
    localStorage.removeItem("TOKEN");
  };

  render() {
    return (
      <BrowserRouter>
        <React.Fragment>
          <AuthContext.Provider
            value={{
              token: this.state.token,
              userId: this.state.userId,
              login: this.login,
              logout: this.logout,
              webservice: this.state.webservice
            }}>
            <div className="grid-container">
              <MainNavigation />
              <main>
                <Switch>
                  {this.state.token &&
                    <Redirect from="/" to="/projects" exact />
                  }
                  {this.state.token && (
                    <Redirect from="/auth" to="/projects" exact />
                  )}
                  {this.state.token && (
                    <Redirect from="/createAccount" to="/projects" exact />
                  )}


                  {!this.state.token && (
                    <Route path="/auth" component={AuthPage} />
                  )}
                  {!this.state.token && (
                    <Route path="/createAccount" component={CreateAccountPage} />
                  )}
                  {this.state.token && (
                    <Route path="/projects" component={ProjectsPage} />
                  )}
                  {this.state.token && (
                    <Route path="/editor" component={EditorPage} />
                  )}

                  {!this.state.token &&
                    <Redirect to="/auth" exact />
                  }
                </Switch>
              </main>
            </div>
          </AuthContext.Provider>
        </React.Fragment>
      </BrowserRouter>
    );
  }
}

export default App;
