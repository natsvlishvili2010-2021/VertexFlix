import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Providers from '@/components/Providers';

export const metadata = {
  title: 'VertexFlix - Watch Movies & TV Shows',
  description: 'Stream your favorite movies and TV shows for free',
  verification: {
    google: 'Nuj4a41GCUU167KjjERsFDRrKreTNeipIfZdd5j9BjA',
  },
  icons: {
    icon: '/logo.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="google-site-verification" content="Nuj4a41GCUU167KjjERsFDRrKreTNeipIfZdd5j9BjA" />
      </head>
      <body className="min-h-screen flex flex-col">
        <Providers>
          <Navbar />
          <main className="flex-1 pt-16">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
