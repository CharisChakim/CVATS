import Editor from '@/components/Editor';
import Preview from '@/components/Resume/Preview';
import Tabs from '@/components/Tabs';

const page = ({ searchParams: { tab = 'contact' } }) => {
    return (
        <div className="mx-auto mt-8 flex max-w-screen-xl 2xl:max-w-screen-2xl flex-col gap-10 px-3 pb-8 md:flex-row md:mt-8 2xl:mt-14 2xl:gap-16">
            <div className="flex-grow order-2 md:order-1">
                <Tabs activeTab={tab} />
                <Editor tab={tab} />
            </div>
            <div className="order-1 md:order-2 flex justify-center">
                <Preview />
            </div>
        </div>
    );
};

export default page;
