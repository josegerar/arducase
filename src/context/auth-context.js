import React from 'react';

export default React.createContext({
    token: null,
    userId: null,
    webservice: null,
    email: null,
    login: (token) => {},
    logout: () => {}
});