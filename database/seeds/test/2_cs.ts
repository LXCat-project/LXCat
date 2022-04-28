import 'dotenv/config'
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { insert_input_set } from '../../../app/src/ScatteringCrossSection/db'

export default async function() {
    const dir = join(__dirname, 'crosssections')
    const files = await readdir(dir)
    for (const file of files) {
        const afile = join(dir, file)
        if (afile.endsWith('.json')) {
            const content = await readFile(afile, {encoding: 'utf8' })
            const body = JSON.parse(content)
            const cs_set_id = await insert_input_set(body)
            console.log(`Inserted ${afile} as ${cs_set_id} into CrossSectionSet collection`)
        }
    }
}
