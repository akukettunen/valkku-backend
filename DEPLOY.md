Deploy Guide (valkku-backend)
=================================

This document explains how to deploy the backend to common targets in a *platform-agnostic* way. The app is containerized and uses Sequelize migrations. Wherever possible we run migrations automatically before the app starts.

Prereqs (all targets)
---------------------
- Built Docker image (or use GitHub Actions to build/push to GHCR):
  ghcr.io/<org-or-user>/<repo>/valkku-backend:latest
- A reachable **MySQL** instance for your environment.
- One environment variable: **DATABASE_URL**
  Example: mysql://USER:PASS@HOST:3306/DBNAME?ssl=true
- Optional envs:
  - PORT (default 8333)
- Your image’s entrypoint runs: `npx sequelize-cli db:migrate --env production` before starting the app.
  (If you prefer, run migrations as a separate “release”/predeploy step instead.)

General Checklist (any platform)
--------------------------------
1) Provision a MySQL database and note its URL.
2) Set `DATABASE_URL` in the platform’s environment/secret settings.
3) Deploy the container image OR build from the provided Dockerfile.
4) Ensure migrations run (entrypoint or release step).
5) Confirm logs show “No migrations were executed, database schema was already up to date.” on repeat deploys.
6) Expose port 3000 (or your configured PORT).

Environment Variables
---------------------
- DATABASE_URL  (required)  mysql://USER:PASS@HOST:PORT/DB
- PORT          (optional)  default 3000
----------------------------------------
A) Heroku (Container stacks or buildpacks)
----------------------------------------

Option 1: Buildpacks (simple, Heroku builds from repo)
1. In Heroku Dashboard ➜ Create App.
2. Add ClearDB MySQL or another MySQL add-on (or point to external MySQL). Heroku sets `CLEARDB_DATABASE_URL` for ClearDB.
3. In **Settings ➜ Config Vars**, set:
   - DATABASE_URL  (use your MySQL URL; if using ClearDB, copy it from CLEARDB_DATABASE_URL and ensure mysql:// scheme)
4. In your repo, add a Procfile:
```
   web: npm run start
   release: npx sequelize-cli db:migrate --env production
```
5. Connect Heroku to your GitHub repo and enable automatic deploys from your main/prod branch.

Option 2: Container Registry (Docker image)
1. `heroku container:login`
2. `heroku create <app-name>`
3. `heroku config:set DATABASE_URL="mysql://USER:PASS@HOST:3306/DBNAME?ssl=true"`
4. Push the image:
   - `heroku container:push web -a <app-name>`
   - `heroku container:release web -a <app-name>`
5. Add a Release Phase to run migrations:
   - In your image entrypoint it already runs migrations OR
   - Use a Heroku “release” stage by adding `release:` to Procfile (see Option 1).

Notes:
- Heroku Postgres is common but this app expects MySQL. Use a MySQL add-on (e.g., ClearDB) or external MySQL.

-----------------------------
B) AWS EC2 (Docker on a VM)
-----------------------------
Goal: Run the container directly on a VM with Docker installed.

1) Provision EC2 (Amazon Linux or Ubuntu). Open inbound security group for port 80/443 (via reverse proxy) or 3000 (dev).
2) Install Docker:
   - Amazon Linux: `sudo yum install -y docker && sudo service docker start && sudo usermod -aG docker ec2-user`
   - Ubuntu: `sudo apt-get update && sudo apt-get install -y docker.io`
3) (Optional) Install Docker Compose.
4) Pull and run the image:
   - `docker login ghcr.io -u <github-username> -p <PAT-or-GITHUB_TOKEN>`
   - `docker pull ghcr.io/<org-or-user>/<repo>/valkku-backend:latest`
   - `docker run -d --name valkku --restart=always -p 80:3000       -e DATABASE_URL="mysql://USER:PASS@HOST:3306/DBNAME?ssl=true"       ghcr.io/<org-or-user>/<repo>/valkku-backend:latest`
5) (Optional) Put Nginx in front for TLS on 443 and proxy to :3000.
6) Updates: `docker pull ...:latest && docker rm -f valkku && (re)run docker run ...`

Migrations:
- If using the provided entrypoint, migrations run automatically. Otherwise, run once:
  `docker run --rm -e DATABASE_URL=... ghcr.io/... npx sequelize-cli db:migrate --env production`


------------------
C) Fly.io (simple)
------------------
1) Install CLI: `flyctl auth login`
2) `flyctl launch` (pick “Use existing Dockerfile”). Answer prompts.
3) Set secrets:
   - `flyctl secrets set DATABASE_URL="mysql://USER:PASS@HOST:3306/DBNAME?ssl=true"`
4) In fly.toml set a release command (optional if entrypoint already migrates):
   release_command = "npx sequelize-cli db:migrate --env production"
5) Deploy:
   - `flyctl deploy`

Notes: Fly provides global anycast, built-in TLS, easy scale.


------------------
D) Render (Docker)
------------------
1) Dashboard ➜ New ➜ Web Service ➜ Select your GitHub repo OR use a Render Blueprint.
2) Environment: Docker
3) Add env vars:
   - DATABASE_URL
4) (Option 1) Let entrypoint run migrations automatically.
   (Option 2) Use a “Deploy Hook” / predeploy command:
   - `npx sequelize-cli db:migrate --env production`
5) Click Deploy.


------------------
E) Railway (Docker)
------------------
1) New Project ➜ Deploy from GitHub or Docker image.
2) Add a MySQL plugin (or external MySQL). Copy the connection URL.
3) Add Environment Variables:
   - DATABASE_URL=<copied URL with mysql:// scheme>
4) For migrations:
   - Use a “Deploy Command” / “Start Command” pattern:
     Deploy Command: `npx sequelize-cli db:migrate --env production`
     Start Command:  `node dist/server.js`
   Or keep migrations in the entrypoint.


---------------------------------
F) Google Cloud Run (container)
---------------------------------
1) Create a Cloud SQL for MySQL instance (or any reachable MySQL).
2) Build and push image to Artifact Registry or use GHCR.
3) Deploy:
   - `gcloud run deploy valkku --image ghcr.io/<org>/<repo>/valkku-backend:latest --region <region> --platform managed --port 3000`
4) Set env vars:
   - DATABASE_URL
5) (Optional) If using Cloud SQL auth proxy, your DATABASE_URL host is `127.0.0.1`, and you add the proxy sidecar. Otherwise use public IP + SSL.


----------------------------
G) Azure Web App for Containers
----------------------------
1) Create Web App ➜ Docker ➜ point to GHCR image.
2) Configuration ➜ Application settings:
   - DATABASE_URL=...
   - PORT=3000 (if Azure doesn’t auto-detect)
3) Deployment ➜ Continuous deployment from GitHub (optional).
4) App Service will pull and run the container.


------------------
H) Kubernetes (generic)
------------------
Minimal Deployment + Service (adapt as needed):

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: valkku
spec:
  replicas: 1
  selector:
    matchLabels: { app: valkku }
  template:
    metadata:
      labels: { app: valkku }
    spec:
      containers:
        - name: api
          image: ghcr.io/<org>/<repo>/valkku-backend:latest
          ports: [{ containerPort: 3000 }]
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: valkku-secrets
                  key: DATABASE_URL
          readinessProbe:
            httpGet: { path: /health, port: 3000 }
            initialDelaySeconds: 10
          livenessProbe:
            httpGet: { path: /health, port: 3000 }
            initialDelaySeconds: 20
---
apiVersion: v1
kind: Service
metadata:
  name: valkku
spec:
  type: LoadBalancer
  selector: { app: valkku }
  ports:
    - port: 80
      targetPort: 3000

Create the secret:
kubectl create secret generic valkku-secrets --from-literal=DATABASE_URL="mysql://USER:PASS@HOST:3306/DB"

Migrations:
- Either keep them in the container entrypoint (automatic) OR
- Run a Job / Helm hook to apply migrations before a rollout.


Operational Tips
----------------
- **Backups**: Ensure your DB vendor has PITR/backups enabled before large changes.
- **Secrets**: Never commit credentials. Use platform secrets/vars.
- **Health checks**: Add `/health` endpoint so platforms can probe readiness/liveness.
- **Logs**: Surface Sequelize logs on first deploy; then reduce verbosity.
- **Rollbacks**: Prefer forward-fix migrations over undo-in-place in production.
- **CI images**: Provide a prebuilt image for contributors; they can run:
  docker run -p 3000:3000 -e DATABASE_URL=mysql://... ghcr.io/<org>/<repo>/valkku-backend:latest

Appendix: Example DATABASE_URL Formats
--------------------------------------
- mysql://user:pass@db-host:3306/valkku_prod
- mysql://user:pass@db-host:3306/valkku_dev?ssl=true
- mysql://user:pass@127.0.0.1:3306/valkku_local