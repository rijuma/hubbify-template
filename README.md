# hubbify-template

GitHub template for docker-compose projects hosted behind a
[hubbify](https://github.com/rijuma/hubbify) proxy — the same Caddy reverse
proxy locally and on the server, discovered purely from two container labels.

## Quick start

1. Click "Use this template" and clone your new repo.
2. Search-replace `myapp` with your project name (it appears in the compose
   labels and this README).
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

## How routing works

`infra/compose.yml` declares the local domain; `infra/compose.remote.yml`
overrides only the domain label with the real one:

```yaml
# compose.yml                          # compose.remote.yml
labels:                                labels:
  caddy: myapp.localhost                 caddy: myapp.example.com
  caddy.reverse_proxy: '{{upstreams 3000}}'
```

That's the entire proxy config. The rules (and the reasoning) are in the
hubbify repo: `docs/project-contract.md`.

## Deploying

The canonical deploy is the **Deploy** GitHub workflow (manual dispatch). It
builds and runs the app on your server over a docker SSH context — no agent,
no git checkout on the server. Configure a `production` environment in the
repo settings with:

| Kind     | Name              | Value                                                  |
| -------- | ----------------- | ------------------------------------------------------ |
| variable | `SERVER_SSH`      | `deploy@your-server-ip`                                |
| secret   | `SSH_PRIVATE_KEY` | key authorized for that user                           |
| secret   | `SSH_KNOWN_HOSTS` | output of `ssh-keyscan <server>` (pins the host key)   |
| secret   | `ENV_FILE`        | the app's production env, verbatim (`KEY=value` lines) |

The workflow writes `ENV_FILE` to `infra/.env.remote` on the runner and runs
`just deploy` — production secrets never live on a laptop. To roll back,
re-run the workflow from the previous commit.

For a break-glass manual deploy, create a context and run the same recipe
(whatever `infra/.env.remote` you have locally is what ships):

```bash
docker context create myvps --docker "host=ssh://user@server"
just deploy myvps
```

`just remote-logs myvps`, `just remote-ps myvps`, and `just remote-sh myvps`
operate on the running deployment.

## Project structure

```
├── infra/
│   ├── compose.yml         # Base: services, network, caddy labels (local domain)
│   ├── compose.local.yml   # Dev delta: hot reload, source mounts
│   ├── compose.remote.yml  # Server delta: real domain, prod image, hardening
│   ├── Dockerfile.web      # Multi-stage Dockerfile (dev / prod targets)
│   ├── .env                # Local dev secrets (gitignored, optional)
│   └── .env.remote         # Production secrets (gitignored; written by CI)
├── web/                    # Example Node.js app — replace with yours
└── justfile                # All commands (`just` to list them)
```
