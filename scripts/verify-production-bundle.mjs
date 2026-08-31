import { readdir, readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'

const forbiddenMarkers = [
  'development-demo-token',
  'admin-demo',
  'moderator@genz.club',
  'ambassador@genz.club',
  'demo-superadmin',
]

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? filesIn(path) : [path]
  }))
  return files.flat()
}

const files = (await filesIn('dist')).filter((file) => ['.html', '.js', '.css', '.json'].includes(extname(file)))
const findings = []

for (const file of files) {
  const contents = await readFile(file, 'utf8')
  for (const marker of forbiddenMarkers) {
    if (contents.includes(marker)) findings.push(`${file}: ${marker}`)
  }
}

if (findings.length > 0) {
  throw new Error(`Production bundle contains development-only data:\n${findings.join('\n')}`)
}

console.log(`Production bundle scan passed (${files.length} files checked).`)
