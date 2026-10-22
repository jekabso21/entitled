export type DiffLine = { kind: 'same' | 'added' | 'removed'; text: string }

// Beyond this many line pairs the comparison table gets too big to build in a browser tab.
const MAX_CELLS = 4_000_000

function commonEdges(before: readonly string[], after: readonly string[]) {
  let start = 0
  while (start < before.length && start < after.length && before[start] === after[start]) start++
  let end = 0
  while (
    end < before.length - start &&
    end < after.length - start &&
    before[before.length - 1 - end] === after[after.length - 1 - end]
  ) {
    end++
  }
  return { start, end }
}

// Longest-common-subsequence table, filled from the bottom right so the walk can go forward.
function lcsTable(a: readonly string[], b: readonly string[]) {
  const width = b.length + 1
  const table = new Uint32Array((a.length + 1) * width)
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i * width + j] =
        a[i] === b[j]
          ? (table[(i + 1) * width + j + 1] ?? 0) + 1
          : Math.max(table[(i + 1) * width + j] ?? 0, table[i * width + j + 1] ?? 0)
    }
  }
  return (i: number, j: number) => table[i * width + j] ?? 0
}

function diffMiddle(a: readonly string[], b: readonly string[]): DiffLine[] {
  if (a.length * b.length > MAX_CELLS) {
    return [
      ...a.map((text) => ({ kind: 'removed' as const, text })),
      ...b.map((text) => ({ kind: 'added' as const, text })),
    ]
  }
  const length = lcsTable(a, b)
  const out: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < a.length || j < b.length) {
    const left = a[i]
    const right = b[j]
    if (left !== undefined && left === right) {
      out.push({ kind: 'same', text: left })
      i++
      j++
    } else if (
      right !== undefined &&
      (left === undefined || length(i, j + 1) >= length(i + 1, j))
    ) {
      out.push({ kind: 'added', text: right })
      j++
    } else if (left !== undefined) {
      out.push({ kind: 'removed', text: left })
      i++
    }
  }
  return out
}

/** Line-by-line differences between two Markdown texts, in reading order. */
export function diffLines(before: string, after: string): DiffLine[] {
  const a = before.split('\n')
  const b = after.split('\n')
  const { start, end } = commonEdges(a, b)
  const same = (text: string) => ({ kind: 'same' as const, text })
  return [
    ...a.slice(0, start).map(same),
    ...diffMiddle(a.slice(start, a.length - end), b.slice(start, b.length - end)),
    ...a.slice(a.length - end).map(same),
  ]
}
