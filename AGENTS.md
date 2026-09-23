# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

**Start every task at the recipe index** — `../start-technologies/projects/start-sdk/docs/src/recipes.md`
(or <https://docs.start9.com/packaging/recipes.html>). It maps an intent ("prompt the user to create
admin credentials", "expose a web UI") to the constructs, the reference pages, and a named production
package to copy. Find the recipe before you read this package's neighbours: a package you reach by
grepping may be non-conformant, and the recipe outranks it.

Work this package's `TODO.md` from top to bottom. Keep `README.md` (technical reference for an AI support or administering agent) and `instructions.md` (end-user docs) in sync with your changes.

## This repo

- Game ports ride a `bindPortRange` (UDP 2456-2457) on host `game` — not individual `bindPort` calls. Retiring that range orphans the WAN forward users set up on their router.
- Daemon must keep `runAsInit: true`: the upstream entrypoint ends in `exec tini -- supervisord`, and tini aborts when it is not PID 1.
- No chown oneshot: the image boots as root and chowns `/config` + `/opt/valheim` itself. (The retired Teriyakidactyl image ran as uid 1000 and needed one.)
- Actions execute on the StartOS host, whose base image ships no `unzip`: `uploadWorld.ts` parses ZIPs in-process (`fflate`, bundled via `ncc`). Never shell out to host binaries from actions.
- x86_64 only: upstream publishes no arm64 build, so the manifest must not re-add `aarch64`.
- Registry CI (`tagAndRelease.yml`, `release.yml`) is disabled (`*.disabled`) until community-registry submission — it needs Start9 org vars/secrets this repo doesn't have.
