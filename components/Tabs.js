'use client';

import ResumeFields from '@/config/ResumeFields';
import Link from 'next/link';
import useTranslation from '@/hooks/useTranslation';

const Tabs = ({ activeTab }) => {
    const tabs = Object.keys(ResumeFields);
    const t = useTranslation();

    return (
        <div className="flex w-full gap-2 overflow-x-auto pb-2 md:gap-3">
            {tabs.map(tab => (
                <Link
                    key={tab}
                    className={`tabs relative cursor-pointer rounded-md px-4 py-1.5 text-sm whitespace-nowrap transition-all duration-150 md:text-base 2xl:text-lg ${activeTab === tab ? 'bg-primary-400 text-black' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'}`}
                    href={`/editor/?tab=${tab}`}
                >
                    {t(`tabs.${tab}`)}
                </Link>
            ))}
        </div>
    );
};

export default Tabs;
