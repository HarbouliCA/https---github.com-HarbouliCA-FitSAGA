import { Inter } from 'next/font/google';
import { FirebaseProvider } from '@/contexts/FirebaseContext';
import { AuthProvider } from '@/context/AuthContext';
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
        <FirebaseProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </FirebaseProvider>
      </body>
    </html>
  );
}
