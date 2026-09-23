# Valheim Server

## Documentation

- Upstream image: https://github.com/community-valheim-tools/valheim-server-docker
- Valheim dedicated servers: https://www.valheimgame.com/support/a-guide-to-dedicated-servers/
- Steam server browser: connect via `steam://connect/<server-ip>:2456`

## What you get on StartOS

- Dedicated Valheim server (UDP ports 2456-2457) exposed as the `game` host.
- Worlds persist in the `main` volume (`/config` saves, `/opt/valheim` server files).
- Server settings via the `Configure` action (name, world, password, public listing).
- Existing worlds can be imported with the `Upload World` action (see `Importing a world` below).

## Getting set up

1. Install and start Valheim Server. First start downloads server files via SteamCMD and takes 5-10 minutes.
2. Run Actions → `Configure` to set Server Name, World Name, Password (min 5 chars), and Public listing. To reuse an existing world, enter its exact name; to import one from outside, follow `Importing a world` below, then `Configure` with the uploaded world's name. Service restarts automatically.
3. In Interfaces, enable the `game` address for LAN. For play over the internet, enable WAN and forward UDP 2456-2457 on your router.
4. In Valheim (Steam) → Join Game → Join IP, enter `<server-lan-ip>:2456` plus the password.

## Importing a world

The `Upload World` action downloads a world ZIP from a URL you serve on your own LAN — either a current-format world folder (`.db2`, `.fwl2`, `.chunk` files) or legacy world files (`.db` + `.fwl` pair, converted automatically on first load). Stop the server first if you are replacing the active world.

1. On your PC, put the world ZIP in a folder and open a terminal in that folder.
2. Start a file server with `python3 -m http.server 8000` (Python 3 required; on Windows use `py -m http.server 8000`). Leave the terminal open.
3. Find your PC's LAN address: Linux `hostname -I`, Windows `ipconfig` (IPv4 Address), macOS `ipconfig getifaddr en0`. Your PC and the StartOS box must share the same LAN, and the firewall must allow port 8000.
4. Check it works: open `http://<your-pc-ip>:8000/<name>.zip` in a browser — the ZIP should download.
5. In StartOS run Actions → `Upload World` and paste that same URL, then Submit.
6. Run Actions → `Configure` and set World Name to the uploaded world's exact name (the folder name for current-format worlds, the file name without extension for legacy ones).
