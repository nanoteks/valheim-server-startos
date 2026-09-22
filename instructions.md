# Valheim Server

## Documentation

- Upstream image: https://github.com/Teriyakidactyl/docker-valheim-server
- Valheim dedicated servers: https://www.valheimgame.com/support/a-guide-to-dedicated-servers/
- Steam server browser: connect via `steam://connect/<server-ip>:2456`

## What you get on StartOS

- Dedicated Valheim server (UDP ports 2456-2457) exposed as the `game` host.
- Worlds persist in the `main` volume (`/world` saves, `/app` server files).
- Server settings via the `Configure` action (name, world, password, public listing).

## Getting set up

1. Install and start Valheim Server. First start downloads server files via SteamCMD and takes 5-10 minutes.
2. Run Actions → `Configure` to set Server Name, World Name, Password (min 5 chars), and Public listing. Service restarts automatically.
3. In Interfaces, enable the `game` address for LAN. For play over the internet, enable WAN and forward UDP 2456-2457 on your router.
4. In Valheim (Steam) → Join Game → Join IP, enter `<server-lan-ip>:2456` plus the password.
