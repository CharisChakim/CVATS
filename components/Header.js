'use client';

import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import LangToggle from './LangToggle';
const Header = () => {
    return (
        <header className="mx-auto flex max-w-screen-xl items-center justify-between px-4 py-3 2xl:max-w-screen-2xl">
            <Link href="/" aria-label="CVATS Home" className="flex items-center gap-2.5 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.svg" alt="" width={34} height={34} className="rounded-lg" />
                <span className="font-black text-xl tracking-tight bg-gradient-to-r from-blue-500 to-primary-500 bg-clip-text text-transparent">
                    CVATS
                </span>
            </Link>

            <nav className="flex items-center gap-2">
                <LangToggle />
                <ThemeToggle />
            </nav>
        </header>
    );
};

export default Header;
