import fetch from 'node-fetch'
import type { OAuthConfig, OAuthUserConfig } from 'next-auth/providers'

export interface OrcidProfile {
  orcid: string
}

async function fetchEmail(id: string, sandbox = false) {
  const domain = sandbox ? 'sandbox.orcid.org' : 'orcid.org'
  // Fetch public email
  // TODO get data with client secret to get more req/s
  const res = await fetch(`https://pub.${domain}/v3.0/${id}/email`, {
    headers: {
      Accept: 'application/orcid+json'
    }
  })

  interface OrcidEmailResponse {
    email: Array<{ email: string }>
  }
  const body = await res.json() as OrcidEmailResponse
  if (body?.email[0]?.email) {
    return body.email[0].email
  } else {
    // Fallback to dummy email when public Orcid record does not contain an email
    // TODO fetch email that is visible to trusted parties
    // requires /read-limited scope see https://github.com/ORCID/ORCID-Source/blob/development/orcid-api-web/tutorial/personal_info.md
    return `${id}@${domain}`
  }
}

/**
 * Orcid accounts do not have a profile image so create one based on initial.
 */
function imageFromName(name: string) {
  const initial = name[0]
  if (!initial) {
    // Fallback to generic orcid logo
    return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsSAAALEgHS3X78AAABnElEQVQ4y52UvUtCURjGf968lmQhFGXYEH3QUg0JhkPR4l5T0IUosMGxv6C1KdpahCZbGxscGiXBloIKo0ESEYpEM71+3NvgvXW0j3vp2c57zvPjPQ/nPWCheDrkiKdDDqtzjl/MQSAChAG/Uc4BCSCmBJKpP0HxdGgQOAY2LRo4BaJKIFn6BjIgCSDolPrQ9Caa3vwLlgLCJkwSNo6BIEBoYp8537ZVLEHD89WRkcmlWex3+WhqNeqtMrLk/nTWWxVA7wYuKYFkymksIuLO/FiEYjXDazXD6tQhJTWLLLmRezxkns+4zsfQdQ3B+wkK/9Z/Sc1yfrsFgFseYnnyAE1vcJM/QfSaGfmxoWrjhaunI2aG18WyvztsW6rUC/Q6vd/qJihnFzTuXeG5ciOWcgBmRglg9yejLLkZHVhEcrgY8SwwPbzGxcOeeCQhgmIi6LV6z5uaR20WKdYemR3ZQNMalNUs53c7vNcLIigGnS87jvVodOtUCSSV7rCjtJ+9XaUMT0fYGDMTpj2Qlp0gzFnH1UT95xuxlN2P7QOpwZChGlWkWQAAAABJRU5ErkJggg==`
  }
  const svg = `<svg version="1.1" width="40" height="40" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="20" fill="#a6ce39"/>
    <text x="20" y="34" font-size="36" text-anchor="middle" fill="white">${initial}</text>
  </svg>`
  const svgBase64 = Buffer.from(svg).toString('base64')
  return `data:image/svg+xml;base64,${svgBase64}`
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
    async profile(profile, tokens) {
      const name = typeof tokens.name === 'string' ? tokens.name : ''
      const orcidId = typeof profile.sub === 'string' ? profile.sub : ''
      const email = await fetchEmail(orcidId, true)
      const image = imageFromName(name)
      return {
        id: orcidId,
        name,
        email,
        image
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
    async profile(profile, tokens) {
      const name = typeof tokens.name === 'string' ? tokens.name : ''
      const orcidId = typeof profile.sub === 'string' ? profile.sub : ''
      const email = await fetchEmail(orcidId)
      const image = imageFromName(name)
      return {
        id: orcidId,
        name,
        email,
        image
      }
    },
    options,
  }
}