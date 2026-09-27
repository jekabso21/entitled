const publicPaths = ['/login', '/invite/']

export default defineNuxtRouteMiddleware(async (to) => {
  if (publicPaths.some((path) => to.path.startsWith(path))) return

  const { data: user, refresh } = await useCurrentUser()
  if (!user.value) await refresh()
  if (!user.value) return navigateTo({ path: '/login', query: { redirect: to.fullPath } })

  const inVendorArea = to.path.startsWith('/admin')
  if (inVendorArea && !user.value.vendorRole) return navigateTo('/')
  if (!inVendorArea && user.value.vendorRole) return navigateTo('/admin')
})
