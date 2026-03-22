export const DISCORD_CONFIG = {
  CLIENT_ID: import.meta.env.VITE_DISCORD_CLIENT_ID,
  CLIENT_SECRET: import.meta.env.VITE_DISCORD_CLIENT_SECRET,
  REDIRECT_URI: window.location.origin + '/callback',
  AUTH_URL: 'https://discord.com/api/oauth2/authorize',
  TOKEN_URL: 'https://discord.com/api/oauth2/token',
  USER_API: 'https://discord.com/api/users/@me',
  GUILD_ID: import.meta.env.VITE_DISCORD_GUILD_ID,
  SCOPES: 'identify guilds.members.read',
  ROLES: {
    OWNER: '1352907810425274399',
    CO_OWNER: '1392875975858978927',
    ADMIN: '1352907818134409217',
    STAFF: '1391069471980126321',
    ANIMATEUR: '1448645443356459129',
    BOOSTER: '1353084404330790923',
    VIP_ECLAT: '1485329420498763806',
    VIP_LANTERNE: '1485355075743383642',
    VIP_ETERNEL: '1485355208224673984',
    MEMBRE: '1352907821850693744'
  },
  INVITE_LINK: import.meta.env.VITE_DISCORD_INVITE_LINK
}
