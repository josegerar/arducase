import React from 'react';

export default React.createContext({
    token: null,
    userId: null,
    webservice: null,
    login: (token, userId, tokenExpiration) => {},
    logout: () => {}
});