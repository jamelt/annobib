# AnnoBib Deployment Guide

Step-by-step instructions for setting up the production infrastructure on Google Cloud Platform.

**Prerequisites:**
- A Google account with billing enabled
- `gcloud` CLI installed and authenticated (`gcloud auth login`)
- `terraform` CLI installed (>= 1.5.0)
- `kubectl` installed
- `helm` installed (v3)
- Domain `annobib.com` registered and DNS accessible

---

## Step 1: Create GCP Projects

You need two separate projects for blast-radius isolation.

```bash
# Create the staging project
gcloud projects create annobib-staging --name="AnnoBib Staging"

# Create the production project
gcloud projects create annobib-prod --name="AnnoBib Production"
```

Link both projects to your billing account:

```bash
# List your billing accounts to get the ID
gcloud billing accounts list

# Link billing (replace BILLING_ACCOUNT_ID)
gcloud billing projects link annobib-staging --billing-account=BILLING_ACCOUNT_ID
gcloud billing projects link annobib-prod --billing-account=BILLING_ACCOUNT_ID
```

**Write down your billing account ID** -- you'll need it for the Terraform tfvars files.

---

## Step 2: Enable Required APIs

Run these for **both** projects:

```bash
for PROJECT in annobib-staging annobib-prod; do
  gcloud services enable \
    container.googleapis.com \
    sqladmin.googleapis.com \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com \
    secretmanager.googleapis.com \
    monitoring.googleapis.com \
    compute.googleapis.com \
    servicenetworking.googleapis.com \
    iam.googleapis.com \
    cloudresourcemanager.googleapis.com \
    billingbudgets.googleapis.com \
    --project=$PROJECT
done
```

---

## Step 3: Create Terraform State Bucket

Terraform needs a GCS bucket to store its state files. Create it in the production project:

```bash
gcloud storage buckets create gs://annobib-terraform-state \
  --project=annobib-prod \
  --location=us-central1 \
  --uniform-bucket-level-access

# Enable versioning for safety
gcloud storage buckets update gs://annobib-terraform-state --versioning
```

---

## Step 4: Update Terraform Variables

Edit the tfvars files with your actual values:

**`terraform/environments/staging.tfvars`:**
```hcl
notification_email    = "your-email@example.com"
billing_account_id    = "YOUR_BILLING_ACCOUNT_ID"
```

**`terraform/environments/production.tfvars`:**
```hcl
notification_email    = "your-email@example.com"
billing_account_id    = "YOUR_BILLING_ACCOUNT_ID"
```

You also need to set the database password. Create a file that won't be committed:

```bash
# Generate a strong password
export DB_PASSWORD=$(openssl rand -base64 24)
echo "Save this password somewhere secure: $DB_PASSWORD"
```

---

## Step 5: Provision Staging Infrastructure

```bash
# Initialize Terraform for staging (note the backend-config for state isolation)
make tf-init ENV=staging

# Review what will be created
make tf-plan ENV=staging

# Apply (you'll be prompted for the db_password -- paste the one you generated)
make tf-apply ENV=staging
```

This will take 10-15 minutes. It provisions:
- VPC network with private subnets
- GKE cluster (1-3 spot e2-medium nodes)
- Cloud SQL PostgreSQL (db-f1-micro with pgvector)
- Artifact Registry for Docker images
- Cloud Storage bucket for uploads
- IAM service accounts with Workload Identity
- Monitoring alerts and budget alerts
- Cloud Build service account IAM roles

After completion, note the outputs:
```bash
cd terraform && terraform output
```

---

## Step 6: Install Cluster Add-ons (Staging)

Connect to the staging cluster:

```bash
gcloud container clusters get-credentials annobib-staging-gke \
  --region us-central1 \
  --project annobib-staging
```

### Install nginx-ingress-controller

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=LoadBalancer
```

Wait for the external IP:
```bash
kubectl get svc -n ingress-nginx ingress-nginx-controller -w
```

**Write down this IP address** -- you'll need it for DNS.

### Install cert-manager (for TLS)

```bash
helm repo add jetstack https://charts.jetstack.io
helm repo update

helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set crds.enabled=true
```

Create the Let's Encrypt ClusterIssuer:

```bash
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx
EOF
```

### Install External Secrets Operator

```bash
helm repo add external-secrets https://charts.external-secrets.io
helm repo update

helm install external-secrets external-secrets/external-secrets \
  --namespace external-secrets \
  --create-namespace
```

Create the ClusterSecretStore for GCP:

```bash
kubectl apply -f - <<EOF
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: gcp-secret-store
spec:
  provider:
    gcpsm:
      projectID: annobib-staging
EOF
```

---

## Step 7: Configure DNS

Go to your domain registrar (wherever you registered annobib.com) and create these DNS records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` | `<production-ingress-ip>` | 300 |
| A | `www` | `<production-ingress-ip>` | 300 |
| A | `staging` | `<staging-ingress-ip>` | 300 |
| CNAME | `www` | `annobib.com` | 300 |

**Note:** You won't have the production IP until Step 10. Set up the staging record first, and add the production records after provisioning production.

After DNS propagates (5-30 minutes), update the staging ingress to use the domain:

```bash
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: annobib-ingress
  namespace: annobib-staging
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "300"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "300"
    nginx.ingress.kubernetes.io/limit-rps: "30"
    nginx.ingress.kubernetes.io/limit-burst-multiplier: "5"
    nginx.ingress.kubernetes.io/limit-connections: "10"
spec:
  tls:
    - hosts:
        - staging.annobib.com
      secretName: annobib-staging-tls
  rules:
    - host: staging.annobib.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: annobib-app
                port:
                  number: 80
EOF
```

---

## Step 8: Populate Secret Manager (Staging)

Store your secrets in GCP Secret Manager for the staging environment:

```bash
PROJECT=annobib-staging

# Database URL (Cloud SQL Proxy runs as sidecar, so localhost)
echo -n "postgresql://annobib_app:YOUR_DB_PASSWORD@localhost:5432/annobib" | \
  gcloud secrets create DATABASE_URL --data-file=- --project=$PROJECT

# Auth0 (use a separate staging application/tenant)
echo -n "your-staging-tenant.auth0.com" | \
  gcloud secrets create NUXT_AUTH0_DOMAIN --data-file=- --project=$PROJECT

echo -n "your-staging-client-id" | \
  gcloud secrets create NUXT_AUTH0_CLIENT_ID --data-file=- --project=$PROJECT

echo -n "your-staging-client-secret" | \
  gcloud secrets create NUXT_AUTH0_CLIENT_SECRET --data-file=- --project=$PROJECT

# Stripe (use test mode keys for staging)
echo -n "sk_test_..." | \
  gcloud secrets create NUXT_STRIPE_SECRET_KEY --data-file=- --project=$PROJECT

echo -n "whsec_..." | \
  gcloud secrets create NUXT_STRIPE_WEBHOOK_SECRET --data-file=- --project=$PROJECT

echo -n "pk_test_..." | \
  gcloud secrets create NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY --data-file=- --project=$PROJECT

# OpenAI
echo -n "sk-..." | \
  gcloud secrets create NUXT_OPENAI_API_KEY --data-file=- --project=$PROJECT

# Session secret
echo -n "$(openssl rand -base64 32)" | \
  gcloud secrets create NUXT_SESSION_SECRET --data-file=- --project=$PROJECT

# Google Books API
echo -n "your-google-books-key" | \
  gcloud secrets create NUXT_GOOGLE_BOOKS_API_KEY --data-file=- --project=$PROJECT
```

---

## Step 9: Connect Cloud Build to GitHub

1. Go to the [Cloud Build Triggers page](https://console.cloud.google.com/cloud-build/triggers) in the **annobib-staging** project
2. Click **Connect Repository**
3. Select **GitHub** and authenticate
4. Select your repository
5. Create three triggers:

### Trigger 1: CI (runs on pull requests)
- **Name:** `annobib-ci`
- **Event:** Pull request
- **Source:** Your repo, any branch
- **Config:** Cloud Build config file: `cloudbuild-ci.yaml`

### Trigger 2: Staging Deploy (runs on push to main)
- **Name:** `annobib-staging-deploy`
- **Event:** Push to branch
- **Branch:** `^main$`
- **Config:** Cloud Build config file: `cloudbuild-staging.yaml`
- **Substitution variables:**
  - `_STAGING_DATABASE_URL` = (create via Secret Manager reference)
  - `_STAGING_URL` = `https://staging.annobib.com`

### Trigger 3: Production Deploy (runs on tags)
- **Name:** `annobib-production-deploy`
- **Event:** Push new tag
- **Tag:** `^v.*$`
- **Config:** Cloud Build config file: `cloudbuild-production.yaml`
- **Substitution variables:**
  - `_PROD_DATABASE_URL` = (create via Secret Manager reference)

---

## Step 10: First Staging Deploy

Push your code to main. Cloud Build will automatically:
1. Lint, typecheck, and run unit tests
2. Build the Docker image and push to Artifact Registry
3. Run database migrations against staging
4. Deploy to the staging GKE cluster
5. Run E2E tests

Monitor the build:
```bash
gcloud builds list --project=annobib-staging --limit=5
gcloud builds log LATEST_BUILD_ID --project=annobib-staging --stream
```

After the first successful deploy, seed the staging database with test data:
```bash
make seed ENV=staging
```

Verify the app is running:
```bash
make health ENV=staging

# Or via the domain once DNS is set up
curl https://staging.annobib.com/api/health
```

### Test a rollback

```bash
make rollback ENV=staging
# Verify the previous version is running
make health ENV=staging
```

---

## Step 11: Provision Production Infrastructure

```bash
make tf-init ENV=production
make tf-plan ENV=production
make tf-apply ENV=production
```

Then install the same cluster add-ons (repeat Step 6 but targeting the production cluster):

```bash
gcloud container clusters get-credentials annobib-production-gke \
  --region us-central1 \
  --project annobib-prod
```

Install nginx-ingress, cert-manager (with ClusterIssuer), and External Secrets Operator (with ClusterSecretStore pointing to `annobib-prod`).

**Get the production ingress IP** and update your DNS records (the `@` and `www` A records from Step 7).

---

## Step 12: Populate Secret Manager (Production)

Same as Step 8, but targeting `annobib-prod` project and using **live** credentials:
- Stripe: live mode keys (`sk_live_...`, `pk_live_...`)
- Auth0: production tenant/application
- OpenAI: same key (or a separate one if you prefer billing separation)

```bash
PROJECT=annobib-prod
# Repeat all the gcloud secrets create commands from Step 8 with production values
```

---

## Step 13: First Production Deploy

Create your first release tag:

```bash
make deploy-production TAG=v1.0.0
```

Monitor the build:
```bash
gcloud builds list --project=annobib-staging --limit=5
```

Verify production:
```bash
make health ENV=production
curl https://annobib.com/api/health
```

---

## Step 14: Configure External Services

### Stripe Webhooks

1. Go to [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint for **staging**: `https://staging.annobib.com/api/webhooks/stripe`
   - Select events: `customer.subscription.*`, `invoice.*`, `checkout.session.completed`
   - Copy the webhook signing secret -> update `NUXT_STRIPE_WEBHOOK_SECRET` in Secret Manager for staging
3. Add endpoint for **production**: `https://annobib.com/api/webhooks/stripe`
   - Same events, copy the signing secret -> update in Secret Manager for production

### Auth0

1. Create two Auth0 applications (or tenants):
   - **Staging**: Allowed callback URLs: `https://staging.annobib.com/api/auth/callback`
   - **Production**: Allowed callback URLs: `https://annobib.com/api/auth/callback`
2. Update the Auth0 secrets in Secret Manager for each environment

---

## Ongoing Operations

### Common commands

```bash
# View staging logs
make logs ENV=staging

# View production logs  
make logs ENV=production

# Exec into a staging pod
make shell ENV=staging

# Check detailed health
make health ENV=production

# View cluster status
make cluster-info ENV=staging

# Trigger a database backup
make db-backup ENV=production

# Run a backup restore test
make db-restore-test ENV=production
```

### Deploying changes

```bash
# 1. Develop on a feature branch
git checkout -b feature/my-feature

# 2. Push and create a PR (triggers CI pipeline -- lint, typecheck, unit tests)
git push -u origin feature/my-feature

# 3. Merge to main (auto-deploys to staging)
# Monitor: gcloud builds list --project=annobib-staging --limit=3

# 4. Verify staging is healthy
make health ENV=staging

# 5. When ready, tag a release (deploys to production)
make deploy-production TAG=v1.1.0

# 6. Verify production
make health ENV=production
```

### Rolling back

```bash
# Undo the last deployment
make rollback ENV=production

# Or deploy a specific previous version
# (check Artifact Registry for available tags)
gcloud artifacts docker tags list \
  us-central1-docker.pkg.dev/annobib-staging/annobib/annobib-app \
  --project=annobib-staging
```

### Database migrations

Migrations run automatically in the CI/CD pipeline (staging on merge to main, production on tag). To run manually:

```bash
make migrate ENV=staging
make migrate-rollback ENV=staging
```

### Terraform changes

```bash
make tf-plan ENV=staging    # Review changes
make tf-apply ENV=staging   # Apply changes
make tf-plan ENV=production
make tf-apply ENV=production
```

---

## Cost Monitoring

Budget alerts are configured at $200/mo for staging and $500/mo for production. You'll receive email alerts at 50%, 80%, and 100% of these thresholds.

To check current spend:
```bash
gcloud billing projects describe annobib-staging --format="value(billingAccountName)"
```

Or visit the [GCP Billing Console](https://console.cloud.google.com/billing).
