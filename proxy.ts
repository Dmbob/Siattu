export { auth as proxy } from "@/auth"

export const config = {
  matcher: ["/((?!setup|api|_next/static|_next/image|favicon.ico).*)"],
}
