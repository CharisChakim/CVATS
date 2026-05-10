'use client';

import { useDispatch, useSelector } from 'react-redux';
import Input from '../UI/Input';
import { updateResumeValue } from '@/store/slices/resumeSlice';
import ResumeFields from '@/config/ResumeFields';
import useTranslation, { useLang } from '@/hooks/useTranslation';
import translations from '@/lib/translations';

const SingleEditor = ({ tab }) => {
    const { fields } = ResumeFields[tab];
    const dispatch = useDispatch();
    const resumeData = useSelector(state => state.resume[tab]);
    const t = useTranslation();
    const lang = useLang();

    const handleChange = e => {
        const { name, value } = e.target;
        dispatch(updateResumeValue({ tab, name, value }));
    };

    const localizeField = field => {
        const fieldTrans = translations[lang]?.fields?.[tab]?.[field.name];
        if (!fieldTrans) return field;
        return {
            ...field,
            label: fieldTrans.label ?? field.label,
            placeholder: fieldTrans.placeholder ?? field.placeholder,
        };
    };

    return (
        <div className="grid md:grid-cols-2 gap-4 md:gap-6 md:gap-x-8">
            {fields.map(field => {
                const localized = localizeField(field);
                return (
                    <Input
                        key={field.name}
                        {...localized}
                        onChange={handleChange}
                        value={resumeData?.[field?.name]}
                        aiRefineLabel={localized.aiRefine ? t('editor.aiRefine') : undefined}
                        refiningLabel={localized.aiRefine ? t('editor.refining') : undefined}
                        writeFirstLabel={localized.aiRefine ? t('editor.writeFirst') : undefined}
                        hint={tab === 'summary' && field.name === 'summary' ? t('editor.summaryHint') : undefined}
                    />
                );
            })}
        </div>
    );
};

export default SingleEditor;
