import Link from 'next/link';
import { FaHome } from 'react-icons/fa';

const Header = () => {
    return (
        <header className="mx-auto flex max-w-screen-xl items-center justify-between px-3 py-3 2xl:max-w-screen-2xl">
            <Link
                href="/"
                aria-label="Home"
                className="flex items-center gap-2 rounded-md bg-gray-700 px-3 py-1.5 text-sm text-gray-100 transition hover:bg-gray-600 md:text-base"
            >
                <FaHome />
                <span>Home</span>
            </Link>
        </header>
    );
};

export default Header;
