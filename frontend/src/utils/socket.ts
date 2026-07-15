import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const connectSocket = (token: string) => {
  if (socket) {
    socket.disconnect();
  }

  socket = io('http://localhost:3000', {
    auth: { token },
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
