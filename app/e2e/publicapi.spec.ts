import { test, expect } from '@playwright/test'
import { DockerComposeEnvironment, Wait } from 'testcontainers'
import { StartedDockerComposeEnvironment} from 'testcontainers/dist/docker-compose-environment/started-docker-compose-environment'
import path from 'path';

let dockerEnv: StartedDockerComposeEnvironment;
let baseUrl: string

// with running app and initialized database'
test.beforeAll(async () => {
    test.setTimeout(10 * 60_000); // Spinning up can take long time, 10 min, as image might need to be pulled and build
    const composeFilePath = path.resolve(__dirname, "../..");
    const composeFile = "docker-compose.yml";
    const testComposeFile = "docker-compose.test.yml";
    const env = new DockerComposeEnvironment(composeFilePath, [composeFile, testComposeFile])
        // .withBuild()
        .withEnvFile(path.resolve(composeFilePath, '.env.test'))
        .withStartupTimeout(10 * 60_000) // Build can take long time, 10 min
        .withWaitStrategy("app_1", Wait.forLogMessage("ready - started server on"))
        .withWaitStrategy("database_1", Wait.forLogMessage("is ready for business"))
        .withWaitStrategy("keycloak_1", Wait.forLogMessage("started in"))
    const dockerEnv = await env.up()

    const appContainer = dockerEnv.getContainer("app_1")
    baseUrl = `http://${appContainer.getHost}:${appContainer.getMappedPort(3000)}`

    const setupContainer = dockerEnv.getContainer('setup_1')
    const setupRes = await setupContainer.exec(['setup', 'setup'])
    if (setupRes.exitCode !== 0) {
        console.log(setupRes.output)
        throw new Error(`docker-compose run setup setup failed with exit code ${setupRes.exitCode}`)
    }

    // TODO login with keycloak account

    // TODO add roles to account
})

test.afterAll(async () => {
    dockerEnv.down()
})

test('/api/scat-css', async ({request}) => {
    const headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
    const resp = await request.get('/api/scat-css', { headers })
    expect(resp.ok()).toBeTruthy()

    const data = await resp.json()

    expect(data.items).toEqual([])
})