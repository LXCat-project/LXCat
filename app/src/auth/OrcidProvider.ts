import type { OAuthConfig, OAuthUserConfig } from 'next-auth/providers'

export interface OrcidProfile {
}

export function OrcidSandboxProvider<
  P extends Record<string, any> = OrcidProfile
>(options: OAuthUserConfig<P>): OAuthConfig<P> {
  return {
    id: "orcidsandbox",
    name: "Orcid Sandbox",
    type: "oauth",
    wellKnown:
      "https://sandbox.orcid.org/.well-known/openid-configuration",
    authorization: {
      params: {
        scope: "openid",
      },
    },
    idToken: true,
    profile(profile, tokens) {
        return {
          id: typeof profile.sub === 'string' ? profile.sub : '',
          name: typeof tokens.name === 'string' ? tokens.name : null,
          // TODO retrieve email from personal info,
          // but scope=/read-limited gives invalid scope error because / is urlencoded, while orcid api does not want it encoded
          email: profile.given_name.replace(' ', '+') + '.' + profile.family_name.replace(' ', '+') + '.' + profile.sub + '@orcid-does-not-give-email-so-fakeit.com',
          // TODO dont use generic orcid logo
          image: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAABnElEQVQ4y52UvUtCURjGf968lmQhFGXYEH3QUg0JhkPR4l5T0IUosMGxv6C1KdpahCZbGxscGiXBloIKo0ESEYpEM71+3NvgvXW0j3vp2c57zvPjPQ/nPWCheDrkiKdDDqtzjl/MQSAChAG/Uc4BCSCmBJKpP0HxdGgQOAY2LRo4BaJKIFn6BjIgCSDolPrQ9Caa3vwLlgLCJkwSNo6BIEBoYp8537ZVLEHD89WRkcmlWex3+WhqNeqtMrLk/nTWWxVA7wYuKYFkymksIuLO/FiEYjXDazXD6tQhJTWLLLmRezxkns+4zsfQdQ3B+wkK/9Z/Sc1yfrsFgFseYnnyAE1vcJM/QfSaGfmxoWrjhaunI2aG18WyvztsW6rUC/Q6vd/qJihnFzTuXeG5ciOWcgBmRglg9yejLLkZHVhEcrgY8SwwPbzGxcOeeCQhgmIi6LV6z5uaR20WKdYemR3ZQNMalNUs53c7vNcLIigGnS87jvVodOtUCSSV7rCjtJ+9XaUMT0fYGDMTpj2Qlp0gzFnH1UT95xuxlN2P7QOpwZChGlWkWQAAAABJRU5ErkJggg==`
        }
      },
    options,
  }
}

export default function OrcidProvider<
  P extends Record<string, any> = OrcidProfile
>(options: OAuthUserConfig<P>): OAuthConfig<P> {
  return {
    id: "orcid",
    name: "Orcid",
    type: "oauth",
    wellKnown:
      "https://orcid.org/.well-known/openid-configuration",
    authorization: {
      params: {
        scope: "openid",
      },
    },
    idToken: true,
    profile(profile, tokens) {
      return {
        id: typeof profile.sub === 'string' ? profile.sub : '',
        name: typeof tokens.name === 'string' ? tokens.name : null,
        // TODO retrieve email from personal info,
        // but scope=/read-limited gives invalid scope error because / is urlencoded, while orcid api does not want it encoded
        email: profile.given_name.replace(' ', '+') + '.' + profile.family_name.replace(' ', '+') + '.' + profile.sub + '@orcid-does-not-give-email-so-fakeit.com',
        // TODO dont use generic orcid logo
        image: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAABnElEQVQ4y52UvUtCURjGf968lmQhFGXYEH3QUg0JhkPR4l5T0IUosMGxv6C1KdpahCZbGxscGiXBloIKo0ESEYpEM71+3NvgvXW0j3vp2c57zvPjPQ/nPWCheDrkiKdDDqtzjl/MQSAChAG/Uc4BCSCmBJKpP0HxdGgQOAY2LRo4BaJKIFn6BjIgCSDolPrQ9Caa3vwLlgLCJkwSNo6BIEBoYp8537ZVLEHD89WRkcmlWex3+WhqNeqtMrLk/nTWWxVA7wYuKYFkymksIuLO/FiEYjXDazXD6tQhJTWLLLmRezxkns+4zsfQdQ3B+wkK/9Z/Sc1yfrsFgFseYnnyAE1vcJM/QfSaGfmxoWrjhaunI2aG18WyvztsW6rUC/Q6vd/qJihnFzTuXeG5ciOWcgBmRglg9yejLLkZHVhEcrgY8SwwPbzGxcOeeCQhgmIi6LV6z5uaR20WKdYemR3ZQNMalNUs53c7vNcLIigGnS87jvVodOtUCSSV7rCjtJ+9XaUMT0fYGDMTpj2Qlp0gzFnH1UT95xuxlN2P7QOpwZChGlWkWQAAAABJRU5ErkJggg==`
      }
    },
    options,
  }
}