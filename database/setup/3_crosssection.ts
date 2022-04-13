import 'dotenv/config'
import { db } from '../../app/src/db'
import { CrossSectionInput, CrossSectionInputAsJsonSchema } from '../../app/src/ScatteringCrossSection/schema'

(async () => {
    const collection = db.collection<CrossSectionInput>('CrossSection')
    if ((await collection.exists())) {
        console.log('CrossSection collection already exists')
        return;
    }
    await collection.create({
        schema: {
            rule: CrossSectionInputAsJsonSchema
        }
    })
    console.log('CrossSection collection created')
})();
