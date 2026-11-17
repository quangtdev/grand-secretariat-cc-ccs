# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + vanilla JS + Three.js + xterm.js on the frontend. Node backend with node-pty and WebSocket. The server holds each agent's PTY itself (user decided against tmux). Agents stop when the server stops and are reopened with `--resume` on the next start, so conversations are kept.

## Users

One developer on their own Linux machine, running several Claude Code agents at once across multiple repositories. Today every agent means: open zsh, `cd` into the repo, type `claude --dangerously-skip-permissions` (or an alias of it). They want one place to see all agents, jump into any of them, and start new ones.

## Product Purpose

A local web app that shows every running AI agent session as a character in a 3D scene. Success: the user never opens a terminal by hand to start or find an agent, and never misses an agent that is waiting on them.

## Positioning

The agents are real terminal sessions, not a chat wrapper: clicking a character opens the actual Claude Code prompt of that session, live.

## Operating Context

- Runs on localhost only, single user, desktop browser. The owner's other devices can reach it through Tailscale (`scripts/tailscale-serve.sh`), one login only.
- Agents are launched with `claude --dangerously-skip-permissions` in a repository folder; with the `ccs` account switcher installed, as `ccs <PROFILE> ...` under one of its accounts.
- Repositories live under `~/workspaces`.
- The app stays open for hours beside the editor.

## Capabilities and Constraints

- Each agent = one terminal session = one character in the scene.
- Click a character: open that agent's live terminal prompt.
- An agent waiting for the user's action is flagged: an icon over its head, and it walks to the king's throne to ask for a ruling.
- A separate area of the scene is for summoning a new agent for a new ticket (pick repo, profile, ticket name).
- Terminology: agents are "scribes" (the user first called them "slaves" and replaced the word on 2026-11-13), the user is "the king". UI language: English.
- Must bind to 127.0.0.1 only: it can spawn shells with permissions skipped.

## Evidence on Hand

No existing brand assets, logo, or screenshots. Nothing to fabricate: all on-screen data is live session state.

## Product Principles

1. Status at a glance: who is working, who is waiting, who is done, readable from across the room.
2. One click from the scene to the real prompt.
3. Waiting agents come to the user; the user does not go hunting.
4. The scene is the interface, not decoration around a list.
