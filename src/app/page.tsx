"use client"

import { Providers } from "@/components/subtract/providers"
import { AppShell } from "@/components/subtract/app-shell"

export default function Home() {
  return (
    <Providers>
      <AppShell />
    </Providers>
  )
}
