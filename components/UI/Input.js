'use client';

import { twMerge } from 'tailwind-merge';
import { sentenceCase } from 'change-case';
import ContentEditable from 'react-contenteditable';
import { useRef, useState } from 'react';
import { HiSparkles } from 'react-icons/hi2';
import { CgSpinner } from 'react-icons/cg';
import { IoClose } from 'react-icons/io5';

const inputClassName =
    'block w-full rounded-md border border-gray-300 bg-white/75 p-2 text-sm text-gray-900 shadow-md shadow-gray-200 outline-none focus:border-2 focus:border-primary-500 focus:bg-white md:text-base 2xl:p-2.5 dark:border-gray-600 dark:bg-gray-700/75 dark:text-gray-100 dark:shadow-gray-800 dark:focus:bg-gray-700';

const RefineButton = ({ kind, value, onRefined }) => {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const text = (value || '').toString().trim();
    const disabled = busy || text.length === 0;

    const click = async () => {
        if (disabled) return;
        setError('');
        setBusy(true);
        try {
            const res = await fetch('/api/refine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ kind, text }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to refine');
            onRefined(data.refined);
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(''), 4000);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="mt-1 flex items-center justify-end gap-2">
            {error && <span className="text-xs text-red-400">{error}</span>}
            <button
                type="button"
                onClick={click}
                disabled={disabled}
                title={text.length === 0 ? 'Write something first to refine' : 'Refine with AI'}
                className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-primary-500 to-blue-500 px-2.5 py-1 text-xs font-medium text-white shadow-md transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-none disabled:bg-gray-200 disabled:text-gray-500 dark:disabled:bg-gray-700 dark:disabled:text-gray-400"
            >
                {busy ? <CgSpinner className="animate-spin text-sm" /> : <HiSparkles className="text-sm" />}
                <span>{busy ? 'Refining...' : 'Refine with AI'}</span>
            </button>
        </div>
    );
};

const TagsInput = ({ name, value, onChange, max = 20, placeholder }) => {
    const [draft, setDraft] = useState('');
    const tags = Array.isArray(value) ? value : [];

    const commit = raw => {
        const next = [...tags];
        raw
            .split(/[,\n;]/)
            .map(s => s.trim())
            .filter(Boolean)
            .forEach(s => {
                if (next.length >= max) return;
                if (next.some(t => t.toLowerCase() === s.toLowerCase())) return;
                next.push(s);
            });
        if (next.length !== tags.length) {
            onChange({ target: { name, value: next } });
        }
        setDraft('');
    };

    const remove = i => {
        const next = tags.filter((_, idx) => idx !== i);
        onChange({ target: { name, value: next } });
    };

    const onKeyDown = e => {
        if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
            e.preventDefault();
            if (draft.trim()) commit(draft);
        } else if (e.key === 'Backspace' && draft === '' && tags.length > 0) {
            remove(tags.length - 1);
        }
    };

    const onPaste = e => {
        const txt = e.clipboardData.getData('text');
        if (/[,;\n]/.test(txt)) {
            e.preventDefault();
            commit(txt);
        }
    };

    const atMax = tags.length >= max;

    return (
        <div>
            <div
                className={twMerge(
                    inputClassName,
                    'flex min-h-[2.6rem] flex-wrap items-center gap-1.5 py-1.5 focus-within:border-primary-500',
                )}
            >
                {tags.map((tag, i) => (
                    <span
                        key={`${tag}-${i}`}
                        className="inline-flex items-center gap-1 rounded-md bg-primary-500/20 px-2 py-0.5 text-xs text-primary-200"
                    >
                        {tag}
                        <button
                            type="button"
                            onClick={() => remove(i)}
                            aria-label={`Remove ${tag}`}
                            className="text-primary-200/80 hover:text-white"
                        >
                            <IoClose className="text-sm" />
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={onKeyDown}
                    onPaste={onPaste}
                    onBlur={() => draft.trim() && commit(draft)}
                    placeholder={atMax ? `Max ${max} skills` : placeholder || 'Type a skill, then press Enter'}
                    disabled={atMax}
                    className="min-w-[8rem] flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed dark:text-gray-100 dark:placeholder:text-gray-500"
                />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {tags.length}/{max} skills · press Enter or comma to add
            </p>
        </div>
    );
};

const Input = ({ label, name, type, placeholder, options, span, value, aiRefine, ...props }) => {
    const inputRef = useRef(null);

    const triggerChange = newValue => props.onChange?.({ target: { name, value: newValue } });

    const InputEl = () => {
        if (type === 'tags') {
            return (
                <TagsInput
                    name={name}
                    value={value}
                    onChange={props.onChange}
                    max={props.max ?? 20}
                    placeholder={placeholder}
                />
            );
        }

        if (type === 'textarea' && props.multipoints) {
            const html = `
                <ul class="space-y-1.5 list-disc pl-4 md:pl-5">
                    ${value
                        ?.split('\n')
                        ?.filter(line => line.trim())
                        ?.map(
                            line => `
                            <li>
                                ${line || ''}${' '}
                            </li>
                            `,
                        )
                        .join('')}
                </ul>
            `;

            return (
                <ContentEditable
                    role="textbox"
                    html={value && html}
                    innerRef={inputRef}
                    className={twMerge(inputClassName, 'min-h-56  text-sm md:min-h-40 md:text-sm ')}
                    onChange={e => {
                        const text = inputRef.current.innerText;
                        props.onChange({ target: { name, value: text } });
                    }}
                />
            );
        }

        if (type === 'textarea') {
            return (
                <textarea
                    id={name}
                    name={name}
                    placeholder={placeholder}
                    className={twMerge(inputClassName, 'min-h-56 text-sm md:min-h-40')}
                    {...props}
                >
                    {value}
                </textarea>
            );
        }

        if (type === 'select') {
            return (
                <select
                    id={name}
                    name={name}
                    placeholder={placeholder}
                    className={inputClassName}
                    defaultValue={value}
                    {...props}
                >
                    {options?.map(option => (
                        <option key={option.value} value={option.value}>
                            {option?.name || option?.value}
                        </option>
                    ))}
                </select>
            );
        }

        if (type === 'color') {
            return (
                <input
                    type={'color'}
                    name={name}
                    id={name}
                    className={twMerge(inputClassName, 'py-1')}
                    placeholder={placeholder || `Enter ${label}`}
                    {...props}
                />
            );
        }

        return (
            <input
                type={type ?? 'text'}
                name={name}
                id={name}
                className={inputClassName}
                placeholder={placeholder || `Enter ${label}`}
                defaultValue={type === 'file' ? undefined : props.defaultValue}
                value={value}
                {...props}
            />
        );
    };

    return (
        <div className={`${span ? 'md:col-span-2' : ''}`}>
            {label && (
                <label htmlFor={name} className="mb-0.5 block text-xs text-gray-600 md:text-sm 2xl:text-base dark:text-gray-300">
                    {label ?? sentenceCase(name)} {props.required && '*'}
                </label>
            )}

            {InputEl()}

            {aiRefine && (
                <RefineButton kind={aiRefine} value={value} onRefined={triggerChange} />
            )}
        </div>
    );
};

export default Input;
