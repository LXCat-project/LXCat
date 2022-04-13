import 'dotenv/config'
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { db } from '../../../app/src/db'
import { CrossSectionInput } from '../../../app/src/ScatteringCrossSection/schema'

(async () => {
    const collection = db.collection<CrossSectionInput>('CrossSection')
    const dir = join(__dirname, 'crosssections')
    const files = await readdir(dir)
    for (const file of files) {
        const afile = join(dir, file)
        if (afile.endsWith('.json')) {
            const content = await readFile(afile, {encoding: 'utf8' })
            const body = JSON.parse(content)
            console.log(body)
            const cs = CrossSectionInput.parse(body)
            console.log(cs)
            await collection.save(cs)
            console.log(`Inserted ${afile} into CrossSection collection`)
        }
    }
})();
