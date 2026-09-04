import { GoogleOAuthProvider } from '@react-oauth/google';
import { LanguageProvider } from '../contexts/LanguageContext';
import { SocketProvider } from '../contexts/SocketContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export const AppProviders = ({ children }) => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <LanguageProvider>
        <SocketProvider>
          {children}
        </SocketProvider>
      </LanguageProvider>
    </GoogleOAuthProvider>
  );
};
