/**
 * Real-Time Socket.IO client integration conforming to SRS v3.0 §7 & Phase 1 Gateway
 */

import { io, Socket } from 'socket.io-client';
import { getStoredTokens } from '../api/client';
import { getApiBaseUrl } from '../api/config';

let socketInstance: Socket | null = null;
let currentSocketToken: string | null = null;

export function getSocket(): Socket | null {
  return socketInstance;
}

export function initSocket(): Socket | null {
  const tokens = getStoredTokens();
  if (!tokens?.accessToken) {
    disconnectSocket();
    return null;
  }

  // If already connected with same token, reuse
  if (socketInstance && currentSocketToken === tokens.accessToken && socketInstance.connected) {
    return socketInstance;
  }

  // Disconnect existing if token changed
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }

  const baseUrl = getApiBaseUrl();
  let origin: string;
  try {
    origin = new URL(baseUrl).origin;
  } catch {
    origin = window.location.origin;
  }

  currentSocketToken = tokens.accessToken;

  socketInstance = io(origin, {
    path: '/socket.io',
    auth: {
      token: tokens.accessToken,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    autoConnect: true,
  });

  return socketInstance;
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    currentSocketToken = null;
  }
}
