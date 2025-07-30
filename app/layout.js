import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { ContextProvider } from './ContextApi';
import { ClerkProvider } from '@clerk/nextjs';
import { UserProfileProvider } from './Components/UserProfileProvider';

const inter = Inter({ subsets: ['latin'] });

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
});

export const metadata = {
  title: 'BeamerBrands - Interactive Learning Platform',
  description: 'Create and take interactive quizzes with BeamerBrands',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <title>BeamerBrands</title>
        </head>

        <body className={poppins.variable}>
          <UserProfileProvider>
            <ContextProvider>
              <main>{children}</main>
            </ContextProvider>
          </UserProfileProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
