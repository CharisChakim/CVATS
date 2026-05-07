import { Font } from '@react-pdf/renderer';

Font.register({
    family: 'Carlito',
    fonts: [
        { src: '/fonts/Carlito-Regular.ttf' },
        { src: '/fonts/Carlito-Bold.ttf', fontWeight: 'bold' },
        { src: '/fonts/Carlito-Italic.ttf', fontStyle: 'italic' },
        { src: '/fonts/Carlito-BoldItalic.ttf', fontWeight: 'bold', fontStyle: 'italic' },
    ],
});
