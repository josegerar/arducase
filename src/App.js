import React, { Component } from 'react';
import { BrowserRouter, Route, Redirect, Switch } from 'react-router-dom';

import AuthPage from './pages/Auth';
import ProjectsPage from './pages/Projects';
import EditorPage from './pages/Editor';
import CreateAccountPage from './pages/CreateAccount';
import MainNavigation from './components/Navigation/MainNavigation';
import AuthContext from './context/auth-context';

import './App.css';

//componente principal sobre el cual se ejeecutan internamete todos los demas componentes
class App extends Component {
  state = {
    token: null,
    userId: null,
    email: null,
    webservice: "http://localhost:8000/"
  };

  componentDidMount() {
    this.verifyUser();
  }

  //verificacion inicial del token para decidor que componente mostrar en caso de ser o no valida la session 
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
          const data = this.substrapToken(resData.token);
          this.setState({ token: resData.token, userId: data.userId, email: data.email });
        } else {
          this.logout();
        }
      }).catch(err => {
        console.log(err);
        this.logout();
      });
    }
  }

  substrapToken(token) {
    let payload;
    payload = token.split('.')[1];
    payload = window.atob(payload);
    return JSON.parse(payload);
  }

  //registra la session en el navegador y el la app
  login = (token) => {
    localStorage.setItem("TOKEN", token);
    const data = this.substrapToken(token);
    this.setState({ token: token, userId: data.userId, email: data.email });
  };

  //cierra la session
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
              email: this.state.email,
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
