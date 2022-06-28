import { FullConfig } from '@playwright/test';
import { testOidcServer } from './test-oidc-server';
import { startDbContainer } from '@lxcat/database/src/testutils'
import { createAuthCollections } from '@lxcat/database/src/auth/testutils'
import { createCsCollections } from '@lxcat/database/src/css/queries/testutils'
import { exec } from 'child_process';
import { resolve } from 'path';

async function globalSetup(config: FullConfig) {
    const env = config?.webServer?.env || {}

    console.log('Starting oidc server')
    const oidcUrl = new URL(env.TESTOIDC_CLIENT_ISSUER)
    // start test oidc server
    const oidc = testOidcServer(
        env.TESTOIDC_CLIENT_ID,
        env.TESTOIDC_CLIENT_SECRET,
        env.NEXTAUTH_URL + '/callback/testoidc',
        parseInt(oidcUrl.port),
    )

    console.log('Starting database server')
    // start db container
    const arangoUrl = new URL(env.ARANGO_URL)
    const stopDbContainer = await startDbContainer(
        env.ARANGO_PASSWORD,
        {
            container: 8529,
            host: parseInt(arangoUrl.port)
        }
    )

    console.log('Create collections')
    // create db collections
    await runDbCommand('npm run setup', env);
    // It is up to tests to login 
    // and to populate and truncate db

    console.log('Completed global setup')
    // return teardown method
    return async () => {
        await stopDbContainer()
        oidc.close()
    }
}

export default globalSetup;

async function runDbCommand(command: string, env: { [key: string]: string; }) {
    return new Promise((presolve, reject) => {
        exec(command, {
            cwd: resolve(__dirname, '../../database'),
            env: {
                ...process.env,
                ARANGO_PASSWORD: env.ARANGO_PASSWORD,
                ARANGO_ROOT_PASSWORD: env.ARANGO_PASSWORD,
                ARANGO_URL: env.ARANGO_URL,
            }
        },
            (error, stdout, stderr) => {
                console.log(stdout)
                console.log(stderr)
                if (error) {
                    reject(error)
                }
                presolve(stdout)
            }
        );   
    })
}
