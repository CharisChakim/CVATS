'use client';

import Link from 'next/link';
import ImgTilt from './ImgTilt';
import { FaGithub } from 'react-icons/fa';
import { IoIosRocket } from 'react-icons/io';
import { FaCloudUploadAlt } from 'react-icons/fa';
import { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setFullResume } from '@/store/slices/resumeSlice';
import { useRouter } from 'next/navigation';
import { pdfjs } from 'react-pdf';
import { CgSpinner } from 'react-icons/cg';
import UploadProgress from '@/components/UploadProgress';

// Worker is served from /public so it always matches the installed pdfjs-dist version.
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const page = () => {
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [stage, setStage] = useState('read');
    const [fileName, setFileName] = useState('');
    const dispatch = useDispatch();
    const router = useRouter();

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
            // Reset the file input so the same file can be retried.
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <>
        {loading && <UploadProgress stage={stage} fileName={fileName} />}
        <div
            aria-hidden={loading}
            className={`mx-auto flex h-full min-h-[calc(100vh-5rem)] max-w-screen-xl flex-col items-center justify-center gap-8 overflow-hidden px-3 py-6 text-center lg:flex-row lg:justify-between lg:text-left ${loading ? 'pointer-events-none select-none' : ''}`}
        >
            <div className="flex flex-col items-center lg:items-start lg:w-1/2">
                <h4 className="text-base md:text-xl text-center lg:text-left">
                    <span className="text-gradient">A Free and Open Source Resume Builder</span>
                </h4>
                <h1 className="text-3xl md:mt-2 md:text-4xl 2xl:text-[2.75rem] text-center lg:text-left">
                    <span className="text-gradient">Resume Building Made Simple</span>
                </h1>
                <p className="mt-3 max-w-screen-sm text-sm text-gray-300 md:mt-10 md:text-lg text-center lg:text-left">
                    Resumave is an ATS-friendly resume maker designed to simplify the process of creating professional
                    <span className="hidden md:inline">
                        resumes without the hassle of login or sign-up. With Resumave, users can easily input their
                        details, generate a well-formatted resume, and export it in A4 PDF format.
                    </span>
                </p>

                <div className="mt-8 flex flex-col items-center justify-center gap-3 md:mt-16 md:flex-row md:gap-8 lg:justify-start">
                    <Link href={'/editor'} className="btn-filled w-full md:w-auto">
                        <span>Create My Resume</span>
                        <IoIosRocket />
                    </Link>

                    <button 
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={loading}
                        className="btn w-full md:w-auto flex items-center gap-2"
                    >
                        {loading ? 
                            <>
                                <span>Processing...</span>
                                <CgSpinner className="animate-spin text-xl" />
                            </>
                        :   <>
                                <span>Upload Resume</span>
                                <FaCloudUploadAlt />
                            </>
                        }
                    </button>
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
                <ImgTilt>
                    <img src="/sample.png" className="max-w-full h-auto" />
                </ImgTilt>
            </div>
        </div>
        </>
    );
};

export default page;
