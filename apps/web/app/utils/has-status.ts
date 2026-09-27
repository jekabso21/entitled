export function hasStatus(error: unknown, status: number) {
  return typeof error === 'object' && error !== null && 'statusCode' in error
    ? error.statusCode === status
    : false
}
