import 'dotenv/config'
import { load_css_dir } from '../../app/src/ScatteringCrossSectionSet/loaders'

(async () => {
    const dir = process.argv[2]
    await load_css_dir(dir)
})()
