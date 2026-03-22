/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DISCORD_CLIENT_ID: string
  readonly VITE_DISCORD_CLIENT_SECRET: string
  readonly VITE_DISCORD_GUILD_ID: string
  readonly VITE_DISCORD_INVITE_LINK: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
