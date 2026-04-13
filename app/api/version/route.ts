export function GET() {
  return Response.json({ buildId: process.env.VERCEL_GIT_COMMIT_SHA ?? 'local' })
}
