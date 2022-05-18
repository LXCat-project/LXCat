import { readdir, readFile } from 'fs/promises';
import { insert_input_set } from '../ScatteringCrossSection/queries'
import { join } from 'path';

export async function load_css(fn: string) {
    const content = await readFile(fn, {encoding: 'utf8' })
    const body = JSON.parse(content)
    const cs_set_id = await insert_input_set(body)
    console.log(`Inserted ${fn} as ${cs_set_id} into CrossSectionSet collection`)
}

export async function load_css_dir(dir: string) {
    const files = await readdir(dir)
    for (const file of files) {
        const afile = join(dir, file)
        if (afile.endsWith('.json')) {
            load_css(afile)
        }
    }
}