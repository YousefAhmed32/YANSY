import { GoogleOAuthProvider } from '@react-oauth/google';
import { LanguageProvider } from '../contexts/LanguageContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export const AppProviders = ({ children }) => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <LanguageProvider>
        {children}
      </LanguageProvider>
    </GoogleOAuthProvider>
  );
};
