import io from 'socket.io-client';

export default io({ reconnection: false }); // TODO: check, used to be reconnect: false
