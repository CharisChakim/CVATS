'use client';

import Classic from './Classic';
import Modern from './Modern';

const Resume = ({ data }) => {
    const template = data?.template || 'classic';
    const Template = template === 'modern' ? Modern : Classic;
    return <Template data={data} />;
};

export default Resume;
