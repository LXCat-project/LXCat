import { readdir } from 'fs/promises';
import path from 'path'

(async () => {
    try {
        const dir = process.argv[2]
        const files = await readdir(dir);
        for (const file of files) {
            const afile = path.resolve(dir, file)
            if (afile.endsWith('.ts')) {
                await import(afile)
            }
        }
    } catch (err) {
        console.error(err);
    }
})()
