## Jenkins (local demo + CI notes)

This document shows how to run **Jenkins locally in Docker** (Option B: Jenkins container uses your host Docker) and how to use the multiple Jenkinsfiles in this repo.

---

## 1) Where the Jenkinsfiles are

This repo intentionally keeps multiple pipelines:

- `grpc-tests/jenkins/Jenkinsfile.smoke`
- `grpc-tests/jenkins/Jenkinsfile.full`
- `grpc-tests/jenkins/Jenkinsfile.nightly`

In Jenkins, set the Pipeline “Script Path” to the one you want (example: `grpc-tests/jenkins/Jenkinsfile.full`).

---

## 2) Local Jenkins in Docker (Option B: host Docker socket)

Goal:

- Jenkins runs in a container
- Pipelines can run `agent { docker { ... } }` by talking to your **host Docker daemon**
- No Docker-in-Docker needed

### 2.1) Requirements on your machine

- Docker Desktop / Docker Engine installed and running

### 2.2) Start Jenkins (recommended: docker compose from this repo)

This repo includes a local Jenkins setup under:

- `grpc-tests/jenkins/local/`

Start it from `grpc-tests/`:

```bash
bun run jenkins:up
```

Then open:

- `http://localhost:8080`

Get the initial admin password:

```bash
bun run jenkins:password
```

Tail logs:

```bash
bun run jenkins:logs
```

Stop Jenkins (keeps data in `jenkins/local/jenkins_home`):

```bash
bun run jenkins:down
```

### 2.3) Restart behavior (sleep / Docker restart)

- **If your computer sleeps**: containers pause. Any in-flight build may fail, but your Jenkins state is preserved on disk.
- **If Docker restarts**: the Jenkins container will come back automatically because we use `restart: unless-stopped`.
  - If it doesn’t, just run:

```bash
bun run jenkins:up
```

---

### 2.4) (Alternative) Start Jenkins with `docker run`

If you don’t want to use the repo’s compose setup, you can run Jenkins manually.

Create a persistent home directory (optional but recommended):

```bash
mkdir -p ./jenkins_home
```

Run Jenkins and give it access to Docker:

```bash
docker run --name jenkins-local --rm -p 8080:8080 -p 50000:50000 \
  -v "$(pwd)/jenkins_home:/var/jenkins_home" \
  -v /var/run/docker.sock:/var/run/docker.sock \
  jenkins/jenkins:lts-jdk17
```

Open Jenkins:

- `http://localhost:8080`

Get the initial admin password:

```bash
docker exec -it jenkins-local cat /var/jenkins_home/secrets/initialAdminPassword
```

### 2.5) Install the Docker CLI inside the Jenkins container

Mounting the socket is not enough — the Jenkins container must also have a `docker` client installed.

If you want the quickest local demo, exec into the container as root and install it:

```bash
docker exec -u 0 -it jenkins-local bash
apt-get update && apt-get install -y docker.io
docker version
exit
```

Note:

- For real usage, it’s better to bake a small custom Jenkins image with docker-cli preinstalled.
  - This repo already does that via `grpc-tests/jenkins/local/Dockerfile`.

---

## 3) Plugin checklist (minimal + optional)

### Required (for these Jenkinsfiles)

- **Pipeline** + **Pipeline: Declarative**
- **Git** (if you use “Pipeline script from SCM”)
- **Docker Pipeline** (required for `agent { docker { ... } }`)

### Recommended

- **Credentials Binding** (handy when you start wiring real TLS files/secrets)
- **Workspace Cleanup** (quality-of-life for long-running demo instances)

### Optional (report UX)

- **Allure Jenkins Plugin**
  - Not required, because our pipeline also archives `allure-results/**` and generates `allure-report/**`.
  - If installed, you can add an `allure` post-step and get a nicer “Allure” link in the build UI.
- **HTML Publisher Plugin**
  - Useful if you want Jenkins to publish the generated `grpc-tests/allure-report/` as a clickable HTML report.

---

## 4) Create a Pipeline job (local demo)

Simplest flow for a demo:

1. Create a **Pipeline** job
2. Use **Pipeline script from SCM**
3. Point it at your repo (Git URL)
4. Set “Script Path” to one of:
   - `grpc-tests/jenkins/Jenkinsfile.smoke`
   - `grpc-tests/jenkins/Jenkinsfile.full`
   - `grpc-tests/jenkins/Jenkinsfile.nightly`

If your repo isn’t hosted, push it to a temporary Git remote (GitHub/GitLab/etc.) just for demo purposes.

---

## 5) About Allure size/importance (vs building your own)

Allure is not “required”, but it’s a big productivity win when you need:

- rich attachments (request/metadata/error context)
- filtering/search/grouping
- historical trends (especially in CI)

Building something “similar enough” to Allure is **significant work**:

- You can easily produce **JUnit + JSON** outputs yourself (easy).
- A basic HTML summary is doable (medium).
- An Allure-like UI (attachments, navigation, filtering, history, stable schema, CI integrations) is **hard** and becomes its own product.

Practical compromise many teams use:

- Keep **JUnit** for CI pass/fail + PR annotations.
- Keep **Allure** for humans (debugging failures), generated in CI where Java is allowed.
