import io from 'socket.io-client';

// export default io({ reconnection: false }); // TODO: check, used to be reconnect: false
export default io({ reconnection: true }); // TODO: check, used to be reconnect: false
