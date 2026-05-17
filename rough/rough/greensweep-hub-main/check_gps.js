import exifr from 'exifr';
import fs from 'fs/promises';

async function check() {
    const path = 'C:/Users/yerni/.gemini/antigravity/brain/e68ecd8d-232f-495c-95ee-24d9e933ca0b/uploaded_image_1765900610640.png';
    try {
        const buffer = await fs.readFile(path);
        console.log('Reading file:', path);
        const output = await exifr.parse(buffer);
        console.log('Output:', output);
        const gps = await exifr.gps(buffer);
        console.log('GPS:', gps);
    } catch (e) {
        console.error(e);
    }
}
check();
