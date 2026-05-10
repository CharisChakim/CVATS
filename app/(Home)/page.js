'use client';

import Link from 'next/link';
import { IoIosRocket } from 'react-icons/io';
import { FaCloudUploadAlt } from 'react-icons/fa';
import { FaMagnifyingGlass } from 'react-icons/fa6';
import { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setFullResume } from '@/store/slices/resumeSlice';
import { useRouter } from 'next/navigation';
import { pdfjs } from 'react-pdf';
import { CgSpinner } from 'react-icons/cg';
import UploadProgress from '@/components/UploadProgress';
import useTranslation from '@/hooks/useTranslation';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const HeroVisual = () => (
    <div className="relative w-44 md:w-80 2xl:w-96 select-none mt-6 md:mt-0">
        {/* ATS Score floating badge — top right */}
        <div className="absolute -top-5 -right-3 md:-top-6 md:-right-5 z-10 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 shadow-lg dark:border-gray-600 dark:bg-gray-800">
            <svg className="-rotate-90 shrink-0" width="30" height="30">
                <circle cx="15" cy="15" r="11" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-200 dark:text-gray-700" />
                <circle cx="15" cy="15" r="11" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round"
                    strokeDasharray="69.1" strokeDashoffset="8.3" />
            </svg>
            <div>
                <p className="text-[9px] font-bold leading-none text-gray-800 dark:text-gray-200">ATS Score</p>
                <p className="mt-0.5 text-[8px] font-semibold text-green-600">88 / 100</p>
            </div>
        </div>

        {/* CV image */}
        <div className="overflow-hidden rounded-xl border border-gray-200 shadow-2xl shadow-gray-900/40 dark:border-gray-600 dark:shadow-black/60">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/sample.png" alt="CV example" className="w-full h-auto" />
        </div>

        {/* AI badge — bottom left */}
        <div className="absolute -bottom-4 -left-3 md:-bottom-5 md:-left-4 flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 shadow-lg dark:border-gray-600 dark:bg-gray-800">
            <span className="text-base leading-none">✨</span>
            <div>
                <p className="text-[9px] font-bold leading-none text-gray-800 dark:text-gray-200">AI Refined</p>
                <p className="mt-0.5 text-[8px] text-gray-500 dark:text-gray-400">ATS-optimized</p>
            </div>
        </div>
    </div>
);

const page = () => {
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [stage, setStage] = useState('read');
    const [fileName, setFileName] = useState('');
    const dispatch = useDispatch();
    const router = useRouter();
    const t = useTranslation();

    const extractTextFromPDF = async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
        }
        return fullText;
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (loading) return;

        setFileName(file.name);
        setStage('read');
        setLoading(true);
        try {
            const text = await extractTextFromPDF(file);

            if (!text || text.trim().length === 0) {
                throw new Error('Could not extract any text from the PDF. Is it a scanned image?');
            }

            setStage('parse');
            const response = await fetch('/api/parse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to parse resume');
            }

            setStage('editor');
            dispatch(setFullResume(data));
            router.push('/editor');
        } catch (error) {
            console.error('Error uploading/parsing resume:', error);
            alert(`Error: ${error.message}`);
            setLoading(false);
            setStage('read');
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <>
            {loading && <UploadProgress stage={stage} fileName={fileName} />}
            <div
                aria-hidden={loading}
                className={`mx-auto flex h-full min-h-[calc(100vh-5rem)] max-w-screen-xl flex-col items-center justify-center gap-8 overflow-hidden px-3 py-6 text-center lg:flex-row lg:justify-between lg:text-left animate-fade-in ${loading ? 'pointer-events-none select-none' : ''}`}
            >
                <div className="flex flex-col items-center lg:items-start lg:w-1/2">
                    <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
                        {[t('hero.badge1'), t('hero.badge2'), t('hero.badge3')].map(badge => (
                            <span
                                key={badge}
                                className="rounded-full border border-primary-500/30 bg-primary-500/10 px-3 py-0.5 text-xs font-medium text-primary-400"
                            >
                                {badge}
                            </span>
                        ))}
                    </div>
                    <h1 className="mt-4 text-3xl md:text-4xl 2xl:text-[2.75rem] text-center lg:text-left leading-tight">
                        <span className="text-gradient">{t('hero.title1')}</span>
                        <br />
                        <span className="text-gradient">{t('hero.title2')}</span>
                    </h1>
                    <p className="mt-4 max-w-screen-sm text-sm text-gray-600 dark:text-gray-300 md:mt-6 md:text-base text-center lg:text-left leading-relaxed">
                        <span className="font-semibold text-primary-400">CVATS</span>{' '}
                        {t('hero.description')}
                        <span className="hidden md:inline">{t('hero.descriptionExtra')}</span>
                    </p>

                    <div className="mt-8 flex flex-col sm:flex-row flex-wrap items-start gap-3 md:mt-16 lg:justify-start">
                        <Link href={'/editor'} className="btn-filled w-full sm:w-auto active:scale-95 transition-transform duration-100">
                            <span>{t('hero.startBtn')}</span>
                            <IoIosRocket />
                        </Link>

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={loading}
                            className="btn w-full sm:w-auto flex items-center gap-2 active:scale-95 transition-transform duration-100"
                        >
                            {loading ? (
                                <>
                                    <span>{t('hero.processing')}</span>
                                    <CgSpinner className="animate-spin text-xl" />
                                </>
                            ) : (
                                <>
                                    <span>{t('hero.uploadBtn')}</span>
                                    <FaCloudUploadAlt />
                                </>
                            )}
                        </button>

                        <div className="flex flex-col items-center sm:items-start gap-1 w-full sm:w-auto">
                            <Link href="/scoring" className="btn w-full sm:w-auto flex items-center gap-2 active:scale-95 transition-transform duration-100">
                                <FaMagnifyingGlass />
                                <span className="whitespace-nowrap">{t('hero.scoreMatchBtn')}</span>
                            </Link>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 max-w-[180px] leading-snug">*{t('hero.scoreMatchDesc')}</p>
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".pdf"
                            onChange={handleUpload}
                        />
                    </div>
                </div>
                <div className="lg:w-1/2 flex justify-center lg:justify-end">
                    <HeroVisual />
                </div>
            </div>
        </>
    );
};

export default page;
