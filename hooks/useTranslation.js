'use client';

import { useSelector } from 'react-redux';
import translations from '@/lib/translations';

export function useTranslation() {
    const lang = useSelector(s => s.resume?.lang ?? 'en');
    const dict = translations[lang] ?? translations.en;

    function t(key) {
        const parts = key.split('.');
        let val = dict;
        for (const part of parts) {
            if (val == null) return key;
            val = val[part];
        }
        return val ?? key;
    }

    return t;
}

export function useLang() {
    return useSelector(s => s.resume?.lang ?? 'en');
}

export default useTranslation;
