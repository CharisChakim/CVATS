'use client';

import { useRef, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { pdfjs } from 'react-pdf';
import Link from 'next/link';
import { FaFilePdf, FaEdit, FaArrowLeft, FaRedo } from 'react-icons/fa';
import { FaMagnifyingGlass, FaFileLines, FaBriefcase, FaListCheck, FaChartSimple, FaWandMagicSparkles, FaCircleCheck } from 'react-icons/fa6';
import { CgSpinner } from 'react-icons/cg';
import useTranslation from '@/hooks/useTranslation';
import { serializeCv } from '@/utils/serializeCv';
import JobInput from '@/components/Scoring/JobInput';
import ScoreResults from '@/components/Scoring/ScoreResults';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const LOAD_STEPS = [
    { icon: FaFileLines,         key: 'scoring.loadStep1', delay: 1800 },
    { icon: FaBriefcase,         key: 'scoring.loadStep2', delay: 1800 },
    { icon: FaListCheck,         key: 'scoring.loadStep3', delay: 2600 },
    { icon: FaChartSimple,       key: 'scoring.loadStep4', delay: 2600 },
    { icon: FaWandMagicSparkles, key: 'scoring.loadStep5', delay: null  },
];

const ScoringLoader = ({ t }) => {
    const [activeStep, setActiveStep] = useState(0);

    useEffect(() => {
        let elapsed = 0;
        const timers = LOAD_STEPS.slice(0, -1).map((s, i) => {
            elapsed += s.delay;
            return setTimeout(() => setActiveStep(i + 1), elapsed);
        });
        return () => timers.forEach(clearTimeout);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center py-14 gap-8 animate-fade-in">
            {/* Spinner */}
            <div className="relative h-16 w-16 shrink-0">
                <div className="absolute inset-0 rounded-full border-4 border-primary-400/20" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-400 animate-spin" />
                <FaMagnifyingGlass className="absolute inset-0 m-auto text-2xl text-primary-400" />
            </div>

            <p className="text-base font-semibold tracking-wide">{t('scoring.scoring')}</p>

            {/* Step timeline */}
            <div className="flex flex-col gap-0 w-full max-w-xs">
                {LOAD_STEPS.map(({ icon: Icon, key }, i) => {
                    const done    = i < activeStep;
                    const active  = i === activeStep;
                    const pending = i > activeStep;
                    const isLast  = i === LOAD_STEPS.length - 1;

                    return (
                        <div key={i} className="flex items-stretch gap-3">
                            {/* Icon + connector */}
                            <div className="flex flex-col items-center">
                                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-500 ${
                                    done   ? 'bg-green-500 text-white' :
                                    active ? 'bg-primary-400 text-white ring-4 ring-primary-400/20' :
                                             'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                                }`}>
                                    {done
                                        ? <FaCircleCheck className="text-sm" />
                                        : <Icon className="text-xs" />
                                    }
                                </div>
                                {!isLast && (
                                    <div className={`w-0.5 flex-1 my-1 rounded-full transition-all duration-700 ${
                                        done ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-700'
                                    }`} style={{ minHeight: '1rem' }} />
                                )}
                            </div>

                            {/* Label + pulse */}
                            <div className={`flex items-center gap-2 pb-4 ${isLast ? 'pb-0' : ''} transition-all duration-500 ${
                                pending ? 'opacity-35' : 'opacity-100'
                            }`}>
                                <span className={`text-sm transition-all duration-500 ${
                                    done   ? 'text-green-600 dark:text-green-400' :
                                    active ? 'font-semibold text-primary-500 dark:text-primary-400' :
                                             'text-gray-500 dark:text-gray-400'
                                }`}>
                                    {t(key)}
                                </span>
                                {active && (
                                    <span className="flex gap-0.5">
                                        <span className="h-1 w-1 rounded-full bg-primary-400 animate-bounce [animation-delay:0ms]" />
                                        <span className="h-1 w-1 rounded-full bg-primary-400 animate-bounce [animation-delay:120ms]" />
                                        <span className="h-1 w-1 rounded-full bg-primary-400 animate-bounce [animation-delay:240ms]" />
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const ScoringPage = () => {
    const t = useTranslation();
    const resumeData = useSelector(state => state.resume);
    const fileRef = useRef(null);

    // Wizard state
    const [step, setStep] = useState(1); // 1, 2, 3 (scoring), 4 (results)
    const [cvSource, setCvSource] = useState(null); // 'current' | 'upload'
    const [cvText, setCvText] = useState('');
    const [uploadedFileName, setUploadedFileName] = useState('');
    const [extractingPdf, setExtractingPdf] = useState(false);
    const [jobData, setJobData] = useState(null); // { type: 'text'|'image', value: string }
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');
    const [emptyCvWarning, setEmptyCvWarning] = useState(false);

    const extractTextFromPDF = async file => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map(item => item.str).join(' ') + '\n';
        }
        return fullText;
    };

    const handleSelectCurrent = () => {
        const serialized = serializeCv(resumeData);
        if (!serialized || serialized.trim().length < 30) {
            setEmptyCvWarning(true);
            return;
        }
        setEmptyCvWarning(false);
        setCvText(serialized);
        setCvSource('current');
        setStep(2);
    };

    const handleSelectUpload = () => {
        fileRef.current?.click();
    };

    const handleFileChange = async e => {
        const file = e.target.files[0];
        if (!file) return;
        setExtractingPdf(true);
        setError('');
        try {
            const text = await extractTextFromPDF(file);
            if (!text || text.trim().length < 50) {
                throw new Error('Could not extract text from this PDF. Is it a scanned image?');
            }
            setCvText(text);
            setCvSource('upload');
            setUploadedFileName(file.name);
            setStep(2);
        } catch (err) {
            setError(err.message);
        } finally {
            setExtractingPdf(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    const handleScore = async () => {
        if (!jobData) {
            setError(t('scoring.emptyJobError'));
            return;
        }
        if (!cvText || cvText.trim().length < 50) {
            setError(t('scoring.emptyCvError'));
            return;
        }

        setError('');
        setStep(3);

        try {
            const body =
                jobData.type === 'image'
                    ? { cvText, jobImageBase64: jobData.value }
                    : { cvText, jobText: jobData.value };

            const res = await fetch('/api/score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Scoring failed');
            setResults(data);
            setStep(4);
        } catch (err) {
            setError(err.message || t('scoring.scoreError'));
            setStep(2);
        }
    };

    const handleReset = () => {
        setStep(1);
        setCvSource(null);
        setCvText('');
        setJobData(null);
        setResults(null);
        setError('');
        setUploadedFileName('');
        setEmptyCvWarning(false);
    };

    const ErrorBox = ({ msg }) =>
        msg ? (
            <p className="rounded-md border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                {msg}
            </p>
        ) : null;

    /* Step indicator dots (only for steps 1–3) */
    const StepDots = () => (
        <div className="mb-6 flex items-center justify-center gap-2">
            {[1, 2, 3].map(s => (
                <span
                    key={s}
                    className={`rounded-full transition-all duration-300 ${
                        s === step
                            ? 'h-2.5 w-8 bg-primary-400'
                            : s < step
                            ? 'h-2 w-2 bg-primary-300 dark:bg-primary-600'
                            : 'h-2 w-2 bg-gray-300 dark:bg-gray-600'
                    }`}
                />
            ))}
        </div>
    );

    return (
        <div className="mx-auto max-w-screen-md px-4 pb-16 pt-8 animate-fade-in">
            {/* Title */}
            <div className="mb-6 text-center">
                <div className="mb-3 flex justify-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-400/10 border border-primary-400/20">
                        <FaMagnifyingGlass className="text-3xl text-primary-400" />
                    </span>
                </div>
                <h1 className="text-2xl font-black md:text-3xl">{t('scoring.title')}</h1>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('scoring.subtitle')}</p>
            </div>

            {/* ── Wizard card ── */}
            {step !== 4 && (
                <div className="card p-6 md:p-8">
                    {step < 3 && <StepDots />}

                    {/* Step 1: Select CV */}
                    {step === 1 && (
                        <div className="animate-fade-in">
                            <h2 className="mb-5 font-semibold text-lg">{t('scoring.step1Title')}</h2>

                            <ErrorBox msg={error} />

                            <div className="mt-4 grid sm:grid-cols-2 gap-4">
                                {/* Use Current CV */}
                                <button
                                    onClick={handleSelectCurrent}
                                    className="flex flex-col items-center gap-4 rounded-xl border-2 border-gray-200 bg-gray-50 p-8 text-center transition-all duration-200 hover:border-primary-400 hover:bg-primary-50 active:scale-[0.98] group dark:border-gray-600 dark:bg-gray-800/50 dark:hover:border-primary-400 dark:hover:bg-primary-400/5"
                                >
                                    <FaEdit className="text-4xl text-primary-400 group-hover:scale-110 transition-transform duration-200" />
                                    <div>
                                        <p className="font-semibold">{t('scoring.useCurrent')}</p>
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            {t('scoring.useCurrentDesc')}
                                        </p>
                                    </div>
                                </button>

                                {/* Upload New PDF */}
                                <button
                                    onClick={handleSelectUpload}
                                    disabled={extractingPdf}
                                    className="flex flex-col items-center gap-4 rounded-xl border-2 border-gray-200 bg-gray-50 p-8 text-center transition-all duration-200 hover:border-primary-400 hover:bg-primary-50 active:scale-[0.98] group dark:border-gray-600 dark:bg-gray-800/50 dark:hover:border-primary-400 dark:hover:bg-primary-400/5 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {extractingPdf ? (
                                        <CgSpinner className="text-4xl text-primary-400 animate-spin" />
                                    ) : (
                                        <FaFilePdf className="text-4xl text-primary-400 group-hover:scale-110 transition-transform duration-200" />
                                    )}
                                    <div>
                                        <p className="font-semibold">{t('scoring.uploadNew')}</p>
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            {extractingPdf ? t('scoring.extractingPdf') : t('scoring.uploadNewDesc')}
                                        </p>
                                    </div>
                                </button>
                            </div>

                            {emptyCvWarning && (
                                <div className="mt-4 flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                                    <span className="flex-1">{t('scoring.emptyCvError')}</span>
                                    <Link
                                        href="/editor"
                                        className="shrink-0 font-semibold underline underline-offset-2 hover:opacity-80"
                                    >
                                        {t('scoring.emptyCvRedirect')}
                                    </Link>
                                </div>
                            )}

                            <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
                        </div>
                    )}

                    {/* Step 2: Job Input */}
                    {step === 2 && (
                        <div className="animate-fade-in">
                            {/* CV Source badge */}
                            <div className="mb-5 flex items-center gap-2 rounded-lg border border-primary-400/30 bg-primary-50 px-4 py-2.5 text-sm dark:border-primary-400/20 dark:bg-primary-400/10">
                                {cvSource === 'current'
                                    ? <FaEdit className="text-primary-500 dark:text-primary-400 shrink-0" />
                                    : <FaFilePdf className="text-primary-500 dark:text-primary-400 shrink-0" />
                                }
                                <span className="text-primary-700 dark:text-primary-300 font-medium truncate">
                                    {cvSource === 'current' ? t('scoring.useCurrent') : uploadedFileName}
                                </span>
                                <button
                                    onClick={() => setStep(1)}
                                    className="ml-auto shrink-0 text-xs text-primary-500 hover:underline dark:text-primary-400"
                                >
                                    {t('scoring.back')}
                                </button>
                            </div>

                            <h2 className="mb-4 font-semibold text-lg">{t('scoring.step2Title')}</h2>

                            <JobInput t={t} onJobReady={data => setJobData(data)} />

                            {error && <div className="mt-3"><ErrorBox msg={error} /></div>}

                            <div className="mt-6 flex justify-between">
                                <button
                                    onClick={() => setStep(1)}
                                    className="btn text-sm gap-2 active:scale-95 transition-transform duration-100"
                                >
                                    <FaArrowLeft className="text-xs" />
                                    {t('scoring.back')}
                                </button>
                                <button
                                    onClick={handleScore}
                                    disabled={!jobData}
                                    className="btn-filled text-sm gap-2 active:scale-95 transition-transform duration-100 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {t('scoring.scoreBtn')}
                                    <FaMagnifyingGlass />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Scoring in progress */}
                    {step === 3 && <ScoringLoader t={t} />}
                </div>
            )}

            {/* Step 4: Results — outside card so ScoreResults has its own cards */}
            {step === 4 && results && (
                <div className="animate-fade-in">
                    <ScoreResults results={results} t={t} />

                    {error && <div className="mt-4"><ErrorBox msg={error} /></div>}

                    <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-between">
                        <Link
                            href="/editor"
                            className="btn text-sm gap-2 justify-center active:scale-95 transition-transform duration-100"
                        >
                            <FaArrowLeft className="text-xs" />
                            {t('scoring.backToEditor')}
                        </Link>
                        <button
                            onClick={handleReset}
                            className="btn text-sm gap-2 active:scale-95 transition-transform duration-100"
                        >
                            <FaRedo className="text-xs" />
                            {t('scoring.scoreAgain')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScoringPage;
