# Valheim Server

## Documentation

- Upstream image: https://github.com/community-valheim-tools/valheim-server-docker
- Valheim dedicated servers: https://www.valheimgame.com/support/a-guide-to-dedicated-servers/
- Steam server browser: connect via `steam://connect/<server-ip>:2456`

## What you get on StartOS

- Dedicated Valheim server (UDP ports 2456-2457) exposed as the `game` host.
- Worlds persist in the `main` volume (`/config` saves, `/opt/valheim` server files).
- Server settings via the `Configure` action (name, world, password, public listing).
- Existing worlds can be imported with the `Upload World` action: give the HTTP(S) URL of a ZIP with one complete world — either a current-format world folder (`.db2`, `.fwl2`, `.chunk` files) or legacy world files (`.db` + `.fwl` pair, converted automatically on first load). To serve a world from your own PC, open a terminal in the folder holding the ZIP and run `python3 -m http.server 8000`, then use `http://<your-pc-ip>:8000/<name>.zip` (find the IP in your network settings; your PC and StartOS box must share the same LAN). Stop the server first if you are replacing the active world.

## Getting set up

1. Install and start Valheim Server. First start downloads server files via SteamCMD and takes 5-10 minutes.
2. Run Actions → `Configure` to set Server Name, World Name, Password (min 5 chars), and Public listing. To reuse an existing world, enter its exact name; to import one from outside, serve its ZIP over your LAN (see above), use Actions → `Upload World` with the URL, then `Configure` with the uploaded world's name. Service restarts automatically.
3. In Interfaces, enable the `game` address for LAN. For play over the internet, enable WAN and forward UDP 2456-2457 on your router.
4. In Valheim (Steam) → Join Game → Join IP, enter `<server-lan-ip>:2456` plus the password.
