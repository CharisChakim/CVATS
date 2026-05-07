import Header from '@/components/Header';

import './globals.scss';
import ReduxProvider from '@/store/ReduxProvider';
import {GoogleAnalytics} from '@next/third-parties/google'

export const metadata = {
    metadataBase: 'http://cvats.vercel.app',
    title: 'CVATS — Free AI-Powered Resume Builder',
    description:
        'CVATS is an AI-powered, ATS-friendly resume builder. No login required — input your details, upload a PDF resume, and export a clean A4 PDF in seconds.',
    icons: {
        icon: '/favicon.svg',
        shortcut: '/favicon.svg',
    },
    openGraph: {
        title: 'CVATS',
        images: `/banner.png`,
        type: 'website',
    },
    alternates: {
        canonical: '/',
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                {/* Prevent flash of wrong theme before React hydrates */}
                <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('theme');if(t!=='light')document.documentElement.classList.add('dark');})();` }} />
                <ReduxProvider>
                    <Header />
                    <div className="mx-auto  min-h-[calc(100vh-3rem)]">{children}</div>
                </ReduxProvider>
                <GoogleAnalytics gaId='G-WPXWXJ9MC2' />
            </body>
        </html>
    );
}
