.PHONY: help deploy-staging deploy-production rollback migrate migrate-rollback \
       db-connect db-backup db-restore-test logs shell port-forward health \
       tf-init tf-plan tf-apply cluster-info seed

ENV ?= staging
APP_NAME ?= annobib
REGION ?= us-central1

STAGING_PROJECT := $(APP_NAME)-staging
PROD_PROJECT := $(APP_NAME)-prod
PROJECT := $(if $(filter production,$(ENV)),$(PROD_PROJECT),$(STAGING_PROJECT))
CLUSTER := $(APP_NAME)-$(ENV)-gke
NAMESPACE := $(APP_NAME)-$(ENV)

help:
	@echo "Usage: make <target> ENV=<staging|production>"
	@echo ""
	@echo "Deployment:"
	@echo "  deploy-staging               Push to main (triggers Cloud Build staging pipeline)"
	@echo "  deploy-production TAG=v1.0.0 Create and push a git tag to trigger production deploy"
	@echo "  rollback                     Undo the last deployment"
	@echo ""
	@echo "Database:"
	@echo "  migrate                      Run database migrations"
	@echo "  migrate-rollback             Revert the last migration"
	@echo "  db-connect                   Port-forward to Cloud SQL via proxy"
	@echo "  db-backup                    Trigger an on-demand Cloud SQL backup"
	@echo "  db-restore-test              Restore latest backup to temp instance and validate"
	@echo ""
	@echo "Debugging:"
	@echo "  logs                         Stream pod logs"
	@echo "  shell                        Exec into a running pod"
	@echo "  port-forward                 Forward app port 3000 to localhost:3000"
	@echo "  health                       Check the detailed health endpoint"
	@echo ""
	@echo "Infrastructure:"
	@echo "  tf-init                      Initialize Terraform for the target environment"
	@echo "  tf-plan                      Run Terraform plan"
	@echo "  tf-apply                     Apply Terraform changes"
	@echo "  cluster-info                 Show cluster and node information"
	@echo ""
	@echo "Data:"
	@echo "  seed                         Run seed script against target environment"

# --- Deployment ---

deploy-staging:
	git push origin main

deploy-production:
ifndef TAG
	$(error TAG is required. Usage: make deploy-production TAG=v1.0.0)
endif
	git tag $(TAG)
	git push origin $(TAG)

rollback:
	gcloud container clusters get-credentials $(CLUSTER) --region $(REGION) --project $(PROJECT)
	kubectl rollout undo deployment/$(APP_NAME)-app -n $(NAMESPACE)

# --- Database ---

migrate:
	gcloud container clusters get-credentials $(CLUSTER) --region $(REGION) --project $(PROJECT)
	kubectl run $(APP_NAME)-migrate-$$(date +%s) \
		--rm -it --restart=Never \
		-n $(NAMESPACE) \
		--image=$$(kubectl get deployment $(APP_NAME)-app -n $(NAMESPACE) -o jsonpath='{.spec.template.spec.containers[0].image}') \
		--serviceaccount=$(APP_NAME)-app \
		-- npx tsx scripts/migrate.ts up

migrate-rollback:
	gcloud container clusters get-credentials $(CLUSTER) --region $(REGION) --project $(PROJECT)
	kubectl run $(APP_NAME)-migrate-rollback-$$(date +%s) \
		--rm -it --restart=Never \
		-n $(NAMESPACE) \
		--image=$$(kubectl get deployment $(APP_NAME)-app -n $(NAMESPACE) -o jsonpath='{.spec.template.spec.containers[0].image}') \
		--serviceaccount=$(APP_NAME)-app \
		-- npx tsx scripts/migrate.ts down

db-connect:
	gcloud container clusters get-credentials $(CLUSTER) --region $(REGION) --project $(PROJECT)
	@echo "Connecting to Cloud SQL via port-forward..."
	kubectl port-forward -n $(NAMESPACE) deployment/$(APP_NAME)-app 5432:5432

db-backup:
	gcloud sql backups create --instance=$(APP_NAME)-$(ENV)-db --project=$(PROJECT) --async
	@echo "Backup triggered for $(APP_NAME)-$(ENV)-db"

db-restore-test:
	@echo "Running backup restore test for $(APP_NAME)-$(ENV)-db..."
	bash scripts/db-restore-test.sh $(PROJECT) $(APP_NAME)-$(ENV)-db $(REGION)

# --- Debugging ---

logs:
	gcloud container clusters get-credentials $(CLUSTER) --region $(REGION) --project $(PROJECT)
	kubectl logs -f -l app=$(APP_NAME),component=app -n $(NAMESPACE) --all-containers=true --max-log-requests=10

shell:
	gcloud container clusters get-credentials $(CLUSTER) --region $(REGION) --project $(PROJECT)
	kubectl exec -it deployment/$(APP_NAME)-app -n $(NAMESPACE) -c app -- /bin/sh

port-forward:
	gcloud container clusters get-credentials $(CLUSTER) --region $(REGION) --project $(PROJECT)
	kubectl port-forward -n $(NAMESPACE) deployment/$(APP_NAME)-app 3000:3000

health:
	gcloud container clusters get-credentials $(CLUSTER) --region $(REGION) --project $(PROJECT)
	kubectl exec deployment/$(APP_NAME)-app -n $(NAMESPACE) -c app -- \
		wget -qO- http://localhost:3000/api/health/detailed

# --- Infrastructure ---

tf-init:
	cd terraform && terraform init -backend-config="prefix=terraform/$(ENV)"

tf-plan:
	cd terraform && terraform plan -var-file=environments/$(ENV).tfvars

tf-apply:
	cd terraform && terraform apply -var-file=environments/$(ENV).tfvars

cluster-info:
	gcloud container clusters get-credentials $(CLUSTER) --region $(REGION) --project $(PROJECT)
	kubectl cluster-info
	@echo ""
	kubectl get nodes -o wide
	@echo ""
	kubectl get pods -n $(NAMESPACE) -o wide

# --- Data ---

seed:
	gcloud container clusters get-credentials $(CLUSTER) --region $(REGION) --project $(PROJECT)
	kubectl run $(APP_NAME)-seed-$$(date +%s) \
		--rm -it --restart=Never \
		-n $(NAMESPACE) \
		--image=$$(kubectl get deployment $(APP_NAME)-app -n $(NAMESPACE) -o jsonpath='{.spec.template.spec.containers[0].image}') \
		--serviceaccount=$(APP_NAME)-app \
		-- npx tsx scripts/seed-sources.ts
