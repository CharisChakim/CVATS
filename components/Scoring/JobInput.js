'use client';

import { useState, useRef } from 'react';
import { FaLink, FaFileImage, FaFileAlt } from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';
import { IoClose } from 'react-icons/io5';

const TABS = [
    { id: 'text', icon: FaFileAlt, labelKey: 'pasteText' },
    { id: 'url', icon: FaLink, labelKey: 'enterUrl' },
    { id: 'screenshot', icon: FaFileImage, labelKey: 'uploadScreenshot' },
];

const JobInput = ({ t, onJobReady }) => {
    const [activeTab, setActiveTab] = useState('text');
    const [text, setText] = useState('');
    const [url, setUrl] = useState('');
    const [fetchedText, setFetchedText] = useState('');
    const [fetching, setFetching] = useState(false);
    const [fetchError, setFetchError] = useState('');
    const [screenshotFile, setScreenshotFile] = useState(null);
    const [screenshotPreview, setScreenshotPreview] = useState('');
    const fileRef = useRef(null);

    const handleFetchUrl = async () => {
        if (!url.trim()) return;
        setFetching(true);
        setFetchError('');
        setFetchedText('');
        try {
            const res = await fetch('/api/fetch-job', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch');
            setFetchedText(data.text);
            onJobReady({ type: 'text', value: data.text });
        } catch (err) {
            setFetchError(err.message);
        } finally {
            setFetching(false);
        }
    };

    const handleScreenshotChange = e => {
        const file = e.target.files[0];
        if (!file) return;
        setScreenshotFile(file);
        const reader = new FileReader();
        reader.onload = ev => {
            const base64 = ev.target.result;
            setScreenshotPreview(base64);
            onJobReady({ type: 'image', value: base64 });
        };
        reader.readAsDataURL(file);
    };

    const handleTextChange = e => {
        const val = e.target.value;
        setText(val);
        onJobReady({ type: 'text', value: val });
    };

    const handleTabChange = tab => {
        setActiveTab(tab);
        onJobReady(null);
        setFetchedText('');
        setFetchError('');
    };

    return (
        <div>
            {/* Tab Bar */}
            <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-5">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-150 -mb-px ${
                                activeTab === tab.id
                                    ? 'border-primary-400 text-primary-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        >
                            <Icon className="text-base" />
                            <span className="hidden sm:inline">{t(`scoring.${tab.labelKey}`)}</span>
                        </button>
                    );
                })}
            </div>

            {/* Text Tab */}
            {activeTab === 'text' && (
                <textarea
                    className="block w-full rounded-md border border-gray-300 bg-white/75 p-3 text-sm text-gray-900 shadow-md outline-none focus:border-2 focus:border-primary-500 focus:bg-white dark:border-gray-600 dark:bg-gray-700/75 dark:text-gray-100 dark:focus:bg-gray-700 min-h-48 resize-y transition-all duration-150"
                    placeholder={t('scoring.pasteTextPlaceholder')}
                    value={text}
                    onChange={handleTextChange}
                />
            )}

            {/* URL Tab */}
            {activeTab === 'url' && (
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <input
                            type="url"
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleFetchUrl()}
                            placeholder={t('scoring.urlPlaceholder')}
                            className="block flex-1 rounded-md border border-gray-300 bg-white/75 p-2.5 text-sm text-gray-900 shadow-md outline-none focus:border-2 focus:border-primary-500 focus:bg-white dark:border-gray-600 dark:bg-gray-700/75 dark:text-gray-100 dark:focus:bg-gray-700 transition-all duration-150"
                        />
                        <button
                            onClick={handleFetchUrl}
                            disabled={fetching || !url.trim()}
                            className="btn-filled shrink-0 px-4 text-sm active:scale-95 transition-transform duration-100 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {fetching ? <CgSpinner className="animate-spin" /> : null}
                            <span>{fetching ? t('scoring.fetching') : t('scoring.fetchUrl')}</span>
                        </button>
                    </div>

                    {fetchError && (
                        <p className="text-sm text-red-400 rounded-md bg-red-400/10 px-3 py-2 border border-red-400/20">
                            {fetchError}
                        </p>
                    )}

                    {fetchedText && (
                        <div className="rounded-md border border-green-500/30 bg-green-500/5 p-3">
                            <p className="text-xs font-medium text-green-400 mb-2">✓ Job posting fetched successfully</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-4">{fetchedText.slice(0, 300)}…</p>
                        </div>
                    )}
                </div>
            )}

            {/* Screenshot Tab */}
            {activeTab === 'screenshot' && (
                <div>
                    {!screenshotPreview ? (
                        <label className="flex flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 p-10 cursor-pointer hover:border-primary-400 hover:bg-primary-400/5 transition-all duration-150 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-primary-400">
                            <FaFileImage className="text-4xl text-gray-400" />
                            <div className="text-center">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('scoring.clickOrDrag')}</p>
                                <p className="text-xs text-gray-400 mt-1">{t('scoring.imageOnly')}</p>
                            </div>
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                className="hidden"
                                onChange={handleScreenshotChange}
                            />
                        </label>
                    ) : (
                        <div className="relative rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
                            <img src={screenshotPreview} alt="Job screenshot" className="w-full max-h-64 object-cover object-top" />
                            <button
                                onClick={() => {
                                    setScreenshotFile(null);
                                    setScreenshotPreview('');
                                    onJobReady(null);
                                    if (fileRef.current) fileRef.current.value = '';
                                }}
                                className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-gray-900/70 text-white hover:bg-gray-900 transition-colors duration-150"
                            >
                                <IoClose />
                            </button>
                            <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
                                {screenshotFile?.name}
                                <button
                                    onClick={() => fileRef.current?.click()}
                                    className="ml-3 text-primary-400 hover:underline"
                                >
                                    {t('scoring.changeFile')}
                                </button>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    className="hidden"
                                    onChange={handleScreenshotChange}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default JobInput;
