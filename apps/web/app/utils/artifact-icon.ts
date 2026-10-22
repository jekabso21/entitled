export function artifactIcon(fileName: string) {
  const name = fileName.toLowerCase()
  if (/\.(zip|tar|tgz|gz|xz|bz2|7z)$/.test(name)) return 'i-lucide-file-archive'
  if (/\.(bin|hex|img|fw|elf|dfu|uf2)$/.test(name)) return 'i-lucide-cpu'
  if (/\.(pdf|md|txt)$/.test(name)) return 'i-lucide-file-text'
  if (/\.(json|xml|yaml|yml|ini|cfg|conf)$/.test(name)) return 'i-lucide-file-code'
  return 'i-lucide-package'
}
