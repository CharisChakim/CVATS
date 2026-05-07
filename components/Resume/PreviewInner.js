'use client';

import { useEffect, useRef, useState } from 'react';
import Resume from './pdf';
import { useDispatch, useSelector } from 'react-redux';
import { setTemplate, setOnePage } from '@/store/slices/resumeSlice';
import { CgSpinner } from 'react-icons/cg';

import { usePDF } from '@react-pdf/renderer';
import { Document, Page, pdfjs } from 'react-pdf';
import { FaDownload, FaEye } from 'react-icons/fa6';
import { IoClose } from 'react-icons/io5';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const Loader = () => (
    <div className="flex min-h-96 w-full items-center justify-center">
        <CgSpinner className="mx-auto mt-16 animate-spin text-center text-4xl text-primary-400 md:text-5xl" />
    </div>
);

const TEMPLATES = [
    { id: 'classic', label: 'Classic' },
    { id: 'modern', label: 'Modern' },
];

const PreviewModal = ({ url, onClose }) => {
    const containerRef = useRef(null);
    const [numPages, setNumPages] = useState(0);
    const [width, setWidth] = useState(0);

    useEffect(() => {
        const onKey = e => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const measure = () => {
            const w = containerRef.current?.clientWidth ?? 0;
            // 32px = horizontal padding on the inner scroll area.
            setWidth(Math.max(0, w - 32));
        };
        measure();
        const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
        if (ro && containerRef.current) ro.observe(containerRef.current);
        window.addEventListener('resize', measure);

        return () => {
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('resize', measure);
            ro?.disconnect();
            document.body.style.overflow = prev;
        };
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 md:p-6"
            onClick={onClose}
        >
            <div
                className="relative flex h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-gray-900"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2 dark:border-white/10">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Resume preview</span>
                    <button
                        onClick={onClose}
                        aria-label="Close preview"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
                    >
                        <IoClose className="text-xl" />
                    </button>
                </div>

                <div ref={containerRef} className="flex-1 overflow-auto bg-gray-100 px-4 py-4 dark:bg-gray-800">
                    {width > 0 && (
                        <Document
                            file={url}
                            loading={<Loader />}
                            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                            className="flex flex-col items-center gap-4"
                        >
                            {Array.from({ length: numPages }, (_, i) => (
                                <Page
                                    key={i}
                                    pageNumber={i + 1}
                                    width={Math.min(width, 900)}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                    className="shadow-xl"
                                />
                            ))}
                        </Document>
                    )}
                </div>
            </div>
        </div>
    );
};

const Preview = () => {
    const parentRef = useRef(null);
    const dispatch = useDispatch();
    const resumeData = useSelector(state => state.resume);
    const template = resumeData.template || 'classic';
    const onePage = !!resumeData.onePage;
    const document = <Resume data={resumeData} />;
    const [instance, updateInstance] = usePDF({ document });
    const [modalOpen, setModalOpen] = useState(false);
    const [mainNumPages, setMainNumPages] = useState(0);

    useEffect(() => {
        if (resumeData.saved) updateInstance(document);
    }, [resumeData.saved]);

    useEffect(() => {
        updateInstance(document);
    }, [template]);

    useEffect(() => {
        updateInstance(document);
    }, [onePage]);

    return (
        <>
            <div ref={parentRef} className="relative w-full md:max-w-[24rem] 2xl:max-w-[28rem]">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Template:</span>
                    {TEMPLATES.map(t => (
                        <button
                            key={t.id}
                            onClick={() => dispatch(setTemplate(t.id))}
                            className={`rounded-md px-3 py-1 text-sm transition ${
                                template === t.id
                                    ? 'bg-primary-400 text-black'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Size:</span>
                    {[
                        { id: false, label: 'Normal size' },
                        { id: true, label: 'Compact size' },
                    ].map(opt => (
                        <button
                            key={String(opt.id)}
                            onClick={() => dispatch(setOnePage(opt.id))}
                            title={opt.id ? 'Apply compact preset to fit content on one page' : 'Use standard size'}
                            className={`rounded-md px-3 py-1 text-sm transition ${
                                onePage === opt.id
                                    ? 'bg-primary-400 text-black'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                {instance.loading ?
                    <Loader />
                :   <Document
                        loading={<Loader />}
                        file={instance.url}
                        onLoadSuccess={({ numPages }) => setMainNumPages(numPages)}
                    >
                        <Page
                            pageNumber={1}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            loading={<Loader />}
                            width={parentRef.current?.clientWidth}
                        />
                    </Document>
                }

                {!instance.loading && onePage && mainNumPages > 1 && (
                    <div className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                        ⚠ CV masih {mainNumPages} halaman. Coba kurangi summary, hapus bullet experience tertua, atau pangkas skills.
                    </div>
                )}

                {!instance.loading && (
                    <div className="mt-4 flex justify-around">
                        <button onClick={() => setModalOpen(true)} className="btn text-sm">
                            <span>Preview</span>
                            <FaEye />
                        </button>
                        <a
                            href={instance.url}
                            download={`${resumeData.contact?.name || 'resume'}.pdf`}
                            className="btn text-sm"
                        >
                            <span>Download</span>
                            <FaDownload />
                        </a>
                    </div>
                )}
            </div>

            {modalOpen && instance.url && (
                <PreviewModal url={instance.url} onClose={() => setModalOpen(false)} />
            )}
        </>
    );
};

export default Preview;
