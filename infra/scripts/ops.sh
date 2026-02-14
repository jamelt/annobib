#!/usr/bin/env bash
set -euo pipefail

APP_NAME="annobib"
REGION="us-central1"

ENV="${2:-staging}"

if [[ "$ENV" != "staging" && "$ENV" != "production" ]]; then
  echo "Error: ENV must be 'staging' or 'production' (got '$ENV')"
  exit 1
fi

if [[ "$ENV" == "production" ]]; then
  PROJECT="${APP_NAME}-prod"
else
  PROJECT="${APP_NAME}-staging"
fi

CLUSTER="${APP_NAME}-${ENV}-gke"
NAMESPACE="${APP_NAME}-${ENV}"

get_credentials() {
  gcloud container clusters get-credentials "$CLUSTER" --region "$REGION" --project "$PROJECT"
}

get_app_image() {
  kubectl get deployment "${APP_NAME}-app" -n "$NAMESPACE" \
    -o jsonpath='{.spec.template.spec.containers[0].image}'
}

run_in_cluster() {
  local job_name="${APP_NAME}-${1}-$(date +%s)"
  local command="${@:2}"
  get_credentials
  kubectl run "$job_name" \
    --rm -it --restart=Never \
    -n "$NAMESPACE" \
    --image="$(get_app_image)" \
    --serviceaccount="${APP_NAME}-app" \
    -- $command
}

case "${1:-help}" in
  # --- Deployment ---
  deploy:staging)
    git push origin main
    ;;

  deploy:production)
    TAG="${3:-}"
    if [[ -z "$TAG" ]]; then
      echo "Error: TAG is required. Usage: pnpm ops:deploy:production <tag>"
      echo "Example: pnpm ops:deploy:production v1.0.0"
      exit 1
    fi
    git tag "$TAG"
    git push origin "$TAG"
    ;;

  rollback)
    get_credentials
    kubectl rollout undo deployment/"${APP_NAME}-app" -n "$NAMESPACE"
    ;;

  # --- Remote Database ---
  migrate)
    run_in_cluster migrate npx tsx scripts/db/migrate.ts up
    ;;

  migrate:rollback)
    run_in_cluster migrate-rollback npx tsx scripts/db/migrate.ts down
    ;;

  db:connect)
    get_credentials
    echo "Connecting to Cloud SQL via port-forward..."
    kubectl port-forward -n "$NAMESPACE" deployment/"${APP_NAME}-app" 5432:5432
    ;;

  db:backup)
    gcloud sql backups create --instance="${APP_NAME}-${ENV}-db" --project="$PROJECT" --async
    echo "Backup triggered for ${APP_NAME}-${ENV}-db"
    ;;

  db:restore-test)
    echo "Running backup restore test for ${APP_NAME}-${ENV}-db..."
    bash "$(dirname "$0")/db-restore-test.sh" "$PROJECT" "${APP_NAME}-${ENV}-db" "$REGION"
    ;;

  # --- Debugging ---
  logs)
    get_credentials
    kubectl logs -f -l app="$APP_NAME",component=app -n "$NAMESPACE" \
      --all-containers=true --max-log-requests=10
    ;;

  shell)
    get_credentials
    kubectl exec -it deployment/"${APP_NAME}-app" -n "$NAMESPACE" -c app -- /bin/sh
    ;;

  port-forward)
    get_credentials
    kubectl port-forward -n "$NAMESPACE" deployment/"${APP_NAME}-app" 3000:3000
    ;;

  health)
    get_credentials
    kubectl exec deployment/"${APP_NAME}-app" -n "$NAMESPACE" -c app -- \
      wget -qO- http://localhost:3000/api/health/detailed
    ;;

  # --- Infrastructure ---
  tf:init)
    cd "$(dirname "$0")/../terraform"
    terraform init -backend-config="prefix=terraform/${ENV}"
    ;;

  tf:plan)
    cd "$(dirname "$0")/../terraform"
    terraform plan -var-file="environments/${ENV}.tfvars"
    ;;

  tf:apply)
    cd "$(dirname "$0")/../terraform"
    terraform apply -var-file="environments/${ENV}.tfvars"
    ;;

  cluster:info)
    get_credentials
    kubectl cluster-info
    echo ""
    kubectl get nodes -o wide
    echo ""
    kubectl get pods -n "$NAMESPACE" -o wide
    ;;

  # --- Data ---
  seed)
    run_in_cluster seed npx tsx scripts/db/seed-sources.ts
    ;;

  # --- Help ---
  help|*)
    cat <<USAGE
Usage: pnpm ops:<command> [ENV]    (ENV defaults to 'staging')

Deployment:
  ops:deploy:staging                    Push to main (triggers Cloud Build)
  ops:deploy:production <tag>           Create and push a git tag
  ops:rollback [ENV]                    Undo the last deployment

Remote Database:
  ops:migrate [ENV]                     Run migrations in the cluster
  ops:migrate:rollback [ENV]            Revert the last migration in the cluster
  ops:db:connect [ENV]                  Port-forward to Cloud SQL
  ops:db:backup [ENV]                   Trigger an on-demand Cloud SQL backup
  ops:db:restore-test [ENV]             Restore latest backup to temp instance

Debugging:
  ops:logs [ENV]                        Stream pod logs
  ops:shell [ENV]                       Exec into a running pod
  ops:port-forward [ENV]                Forward port 3000 to localhost
  ops:health [ENV]                      Check the detailed health endpoint

Infrastructure:
  ops:tf:init [ENV]                     Initialize Terraform
  ops:tf:plan [ENV]                     Run Terraform plan
  ops:tf:apply [ENV]                    Apply Terraform changes
  ops:cluster:info [ENV]                Show cluster and node information

Data:
  ops:seed [ENV]                        Run seed script in the cluster
USAGE
    ;;
esac
