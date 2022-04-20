import 'dotenv/config'
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { insert_input_set } from '../../../app/src/ScatteringCrossSection/db'

(async () => {
    const dir = join(__dirname, 'crosssections')
    const files = await readdir(dir)
    for (const file of files) {
        const afile = join(dir, file)
        if (afile.endsWith('.json')) {
            const content = await readFile(afile, {encoding: 'utf8' })
            const body = JSON.parse(content)
            await insert_input_set(body)
            console.log(`Inserted ${afile} into CrossSection collections`)
        }
    }
})();
