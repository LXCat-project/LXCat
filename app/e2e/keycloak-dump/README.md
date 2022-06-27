# Keycloak oauth test provider

To have end-to-end tests on the lxcat-ng app we need a oauth provider that is under our control.
So Orcid and GitLab oauth providers are not OK.
There is [Keycloak](http://www.keycloak.org/) which is an open source oauth provider.

The e2e test spin up a keycloak Docker container which imports a test realm dump.

## Test realm dump creation

First spinup a container with

```shell
docker run --rm  -p 8080:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:18.0.2 start-dev
```

Goto http://localhost:8080/admin/master/console and login with ADMIN:ADMIN.

1. [Create realm](http://localhost:8080/admin/master/console/#/create/realm) called `lxcat-ng-test-realm`
2. [Create users](http://localhost:8080/admin/master/console/#/realms/lxcat-ng-test-real/users) with following username:email:password
   * admin:admin@lxcat.net:pass
   * author1:author1@lxcat.net:pass
   * The password must be set in Credentials tab, dont forget to turn off `temporary` field.
   * Set `orcid` and `image` in Attributes tab to `0000-0001-2345-6789` and `/lxcat.png` respectively.
3. [Create client](http://localhost:8080/admin/master/console/#/create/client/lxcat-ng-test-real). This is the oauth provider the lxcat app will authenticate against.
   * Client ID: lxcat-ng-test
   * Client protocol: openid-connect
   * Root URL: http://localhost:3000
   * After creation edit client some more
   * Access type: confidential
   * To Valid Redirect URIs field add `https://localhost:8443`
   * Save it
   * On Mappers tab create mapper to expose orcid and image user attributes
     * orcid mapper
       * Name: orcid
       * Mapper type: User Attribute
       * User attribute: orcid
       * Token Claim Name: orcid
       * Claim JSON Type: string
       * Save it
   * image mapper
       * Name: image
       * Mapper type: User Attribute
       * User attribute: image
       * Token Claim Name: image
       * Claim JSON Type: string
   * On creditials tab copy Secret value to KEYCLOAK_CLIENT_SECRET in /app/e2e/.env.test file.

Lastly make an export of the realm 

```shell
docker exec -ti <image name> sh
cd /opt/keycloak
bin/kc.sh export --realm lxcat-ng-test-realm --file lxcat-ng-test-realm.json
exit
docker cp <image name>:/opt/keycloak/lxcat-ng-test-realm.json app/e2e/keycloak-dump/
```

### Start app

```shell
docker-compose -f docker-compose.yml -f docker-compose.test.yml --env-file ./app/e2e/.env.test up
```