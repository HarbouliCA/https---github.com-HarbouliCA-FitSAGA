import { Inter } from 'next/font/google';
import { FirebaseProvider } from '@/contexts/FirebaseContext';
import { AuthProvider } from '@/context/AuthContext';
import { NextAuthProvider } from '@/components/providers/NextAuthProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'FitSaga Admin Portal',
  description: 'Admin portal for managing FitSaga platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextAuthProvider>
          <FirebaseProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </FirebaseProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
