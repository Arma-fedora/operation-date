/**
 * Media hosting.
 *
 * The CDN in front of the static host is unreliable from some mobile
 * networks, so the files are also kept in the repository and served straight
 * from GitHub's CDN. The link is pinned to a commit so it never breaks when
 * the branch moves and can be cached for a long time.
 */
const REPO = 'Arma-fedora/operation-date'
const COMMIT = '8bd28ad642c113705ee6951c87cacc14a7e9ea76'

export const MEDIA_BASE = `https://raw.githubusercontent.com/${REPO}/${COMMIT}/media`
export const MEDIA_BRANCH_BASE = `https://raw.githubusercontent.com/${REPO}/media`

export function mediaUrl(path: string): string {
  return `${MEDIA_BASE}/${path}`
}
