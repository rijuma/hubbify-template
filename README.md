# hubbify-template

GitHub template for docker-compose projects hosted behind a
[hubbify](https://github.com/rijuma/hubbify) proxy — the same Caddy reverse
proxy locally and on the server, discovered purely from two container labels.

## Quick start

1. Click "Use this template" and clone your new repo.
2. Search-replace `myapp` with your project name (it appears in the justfile,
   the compose labels and this README).
3. Run it:

```bash
just dev
```

The example app is served at `https://myapp.localhost` — real HTTPS via the
local hubbify proxy (`just up` in the hubbify repo starts it).

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [just](https://github.com/casey/just)
- The [hubbify](https://github.com/rijuma/hubbify) proxy running (locally for
  dev, on the server for deploys)

## Environments

Every environment is a folder under `envs/`. A folder with a `server.conf`
is a **remote target** — it declares which docker SSH context and which
hubbify server it deploys to. A folder without one is **local**. The
template ships two:

```
envs/
├── local/
│   ├── compose.yml     # dev delta: hot reload, source mounts, local db
│   └── .env.example    # copy to .env (gitignored, optional)
└── prod/
    ├── server.conf     # DOCKER_CONTEXT, SERVER_NAME, PROTECTED=true, optional ENV
    ├── compose.yml     # real domain, prod image, hardening
    └── .env.example    # real values come from CI (or a local .env)
```

Add a `stg`/`uat` by copying `prod`'s folder and pointing its `server.conf`
elsewhere. Every recipe takes the env name: `just up` (defaults to `local`),
`just logs prod`, `just ps stg`, `just sh prod web`.

Each env runs as its own compose project (`myapp-<env>`), so several envs
can share one server without colliding.

## How routing works

`infra/compose.yml` declares the local domain; each remote env's overlay
overrides only the domain label:

```yaml
# infra/compose.yml                     # envs/prod/compose.yml
labels:                                labels:
  caddy: myapp.localhost                 caddy: myapp.example.com
  caddy.reverse_proxy: '{{upstreams 3000}}'
```

That's the entire proxy config. The rules (and the reasoning) are in the
hubbify repo: `docs/project-contract.md`. Services that differ per env (a
local postgres vs a managed database) are declared in the env overlays that
need them — the base holds only what is true everywhere.

## Deploying

The canonical deploy is the **Deploy** GitHub workflow (manual dispatch,
pick the GitHub environment). It builds and runs the app on your server
over a docker SSH context — no agent, no git checkout on the server. Create
one GitHub environment per `envs/` folder that has a `server.conf`. The
environment is named like the folder, or the folder's `server.conf`
declares `ENV=<github environment>` when the names differ (`production`
for `envs/prod`). Each GitHub environment carries:

| Kind     | Name              | Value                                                 |
| -------- | ----------------- | ----------------------------------------------------- |
| variable | `SERVER_SSH`      | `deploy@your-server-ip`                               |
| secret   | `SSH_PRIVATE_KEY` | key authorized for that user                          |
| secret   | `SSH_KNOWN_HOSTS` | output of `ssh-keyscan <server>` (pins the host key)  |
| secret   | `ENV_FILE`        | the app's env for that target, verbatim (`KEY=value`) |

A `check` job resolves the folder first (a `server.conf` with a matching
`ENV=`, else the folder of the same name) and fails listing the remote
envs when none exists; it has no environment binding, so nothing is
created on GitHub by mistake. The deploy job then fails with a pointer to
Settings → Environments when the chosen environment has no `SERVER_SSH`
yet, so a missing setup is one clear error instead of an SSH failure. It
then writes `ENV_FILE`
to `envs/<env>/.env` on the runner and runs
the same `just deploy <env>` you'd run by hand — secrets never live on a
laptop. Put the human gate in the GitHub environment's protection rules
(required reviewers, "prod deploys only from main"). To roll back, re-run
the workflow from the previous commit.

For a break-glass manual deploy, create the context `server.conf` names and
run the recipe (whatever `envs/<env>/.env` you have locally is what ships):

```bash
docker context create myvps --docker "host=ssh://user@server"
just deploy prod
```

Three guards make wrong-target deploys fail closed:

- an unknown env name errors out — the target is repo data, not a CLI arg;
- the deploy aborts unless the server behind the context carries the
  `hubbify.server` stamp matching the env's `SERVER_NAME`;
- an env marked `PROTECTED=true` asks you to type its name first (CI skips
  the prompt — GitHub environment protection is the gate there).

## Project structure

```
├── infra/
│   ├── compose.yml         # Base: what's true in every env (services, labels, network)
│   └── Dockerfile.web      # Multi-stage Dockerfile (dev / prod targets)
├── envs/                   # One folder per environment (see above)
├── web/                    # Example Node.js app — replace with yours
└── justfile                # All commands (`just` to list them)
```
