const mailpitUrl = process.env.MAILPIT_URL ?? 'http://localhost:8025'

type MailpitSearch = { messages: { ID: string }[] }
type MailpitMessage = { Text: string }

export async function findInvitationPath(to: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const search = (await fetch(
      `${mailpitUrl}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`,
    ).then((res) => res.json())) as MailpitSearch
    const id = search.messages[0]?.ID
    if (id) {
      const message = (await fetch(`${mailpitUrl}/api/v1/message/${id}`).then((res) =>
        res.json(),
      )) as MailpitMessage
      const path = /\/invite\/[\w-]+/.exec(message.Text)?.[0]
      if (path) return path
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`no invitation email for ${to}`)
}
