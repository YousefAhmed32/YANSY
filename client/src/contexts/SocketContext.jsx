import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';

/* ═══════════════════════════════════════════════════════════════
   Single shared authenticated Socket.IO connection for the whole
   app. Mounted once (see providers/AppProviders.jsx) so every
   consumer — notifications, customer Messages, AdminMessages, the
   admin dashboard live-counters — shares one connection instead of
   each opening its own (which used to happen: Layout.jsx and
   AdminDashboard.jsx each independently called `io(...)`).

   Room membership is authorized server-side purely from the JWT on
   the handshake — this context never trusts a client-picked id for
   anything private; it only ever asks the server to join/leave a
   *thread* room, which the server verifies against real
   participation before allowing (see server/server.js `join-thread`).
   ═══════════════════════════════════════════════════════════════ */

const SocketContext = createContext(null);

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};

const getSocketUrl = () =>
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL?.replace('/api', '') ||
  (import.meta.env.DEV ? 'http://localhost:5000' : 'https://api.yansytech.com');

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const [socket, setSocket]       = useState(null);
  const [connected, setConnected] = useState(false);
  const reconnectedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user?._id) {
      setSocket(null);
      setConnected(false);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;

    const s = io(getSocketUrl(), {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    s.on('connect', () => {
      setConnected(true);
      // A reconnect (network blip, laptop sleep) can miss events fired
      // while disconnected — mark it so consumers know to refetch
      // authoritative state instead of trusting an unbroken event stream.
      if (reconnectedRef.current) {
        s.emit('client-reconnected');
      }
      reconnectedRef.current = true;
    });
    s.on('disconnect', () => setConnected(false));
    s.on('connect_error', () => setConnected(false));

    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(null);
      setConnected(false);
      reconnectedRef.current = false;
    };
  }, [isAuthenticated, user?._id]);

  const joinThread = useCallback((threadId) => {
    if (threadId) socket?.emit('join-thread', threadId);
  }, [socket]);

  const leaveThread = useCallback((threadId) => {
    if (threadId) socket?.emit('leave-thread', threadId);
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, connected, joinThread, leaveThread }}>
      {children}
    </SocketContext.Provider>
  );
};
