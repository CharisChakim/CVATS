'use client';

import dynamic from 'next/dynamic';
import { CgSpinner } from 'react-icons/cg';

const Loader = () => (
    <div className="flex min-h-96 w-full items-center justify-center">
        <CgSpinner className="mx-auto mt-16 animate-spin text-center text-4xl text-primary-400 md:text-5xl" />
    </div>
);

// @react-pdf/renderer's usePDF hook is web-only; loading PreviewInner via
// dynamic({ ssr: false }) keeps the import out of the server render path.
const PreviewInner = dynamic(() => import('./PreviewInner'), {
    ssr: false,
    loading: () => <Loader />,
});

export default function Preview() {
    return <PreviewInner />;
}
