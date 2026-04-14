# Cluster Add-ons
#
# Manages Helm releases and CRD-based resources that run inside the GKE cluster.
# Everything here depends on the GKE cluster being ready.

# App namespace
resource "kubernetes_namespace" "app" {
  count = var.enabled ? 1 : 0

  metadata {
    name = "${var.app_name}-${var.environment}"

    labels = {
      app         = var.app_name
      environment = var.environment
    }
  }

  depends_on = [module.gke]
}

# --- Ingress NGINX ---

resource "helm_release" "ingress_nginx" {
  count            = var.enabled ? 1 : 0
  name             = "ingress-nginx"
  repository       = "https://kubernetes.github.io/ingress-nginx"
  chart            = "ingress-nginx"
  namespace        = "ingress-nginx"
  create_namespace = true
  version          = "4.12.0"
  timeout          = 600

  set {
    name  = "controller.service.type"
    value = "LoadBalancer"
  }

  set {
    name  = "controller.metrics.enabled"
    value = "true"
  }

  set {
    name  = "controller.resources.requests.cpu"
    value = "100m"
  }

  set {
    name  = "controller.resources.requests.memory"
    value = "128Mi"
  }

  depends_on = [module.gke]
}

# --- cert-manager ---

resource "helm_release" "cert_manager" {
  count            = var.enabled ? 1 : 0
  name             = "cert-manager"
  repository       = "https://charts.jetstack.io"
  chart            = "cert-manager"
  namespace        = "cert-manager"
  create_namespace = true
  version          = "1.17.1"
  timeout          = 600

  set {
    name  = "crds.enabled"
    value = "true"
  }

  depends_on = [module.gke]
}

# Let's Encrypt ClusterIssuer (depends on cert-manager CRDs)
resource "kubectl_manifest" "letsencrypt_issuer" {
  count = var.enabled ? 1 : 0

  yaml_body = <<-YAML
    apiVersion: cert-manager.io/v1
    kind: ClusterIssuer
    metadata:
      name: letsencrypt-prod
    spec:
      acme:
        server: https://acme-v02.api.letsencrypt.org/directory
        email: ${var.notification_email}
        privateKeySecretRef:
          name: letsencrypt-prod
        solvers:
          - http01:
              ingress:
                class: nginx
  YAML

  depends_on = [helm_release.cert_manager]
}

# --- External Secrets Operator ---

resource "helm_release" "external_secrets" {
  count            = var.enabled ? 1 : 0
  name             = "external-secrets"
  repository       = "https://charts.external-secrets.io"
  chart            = "external-secrets"
  namespace        = "external-secrets"
  create_namespace = true
  version          = "0.14.3"
  timeout          = 600

  depends_on = [module.gke]
}

# ClusterSecretStore for GCP Secret Manager (depends on ESO CRDs)
resource "kubectl_manifest" "gcp_secret_store" {
  count = var.enabled ? 1 : 0

  yaml_body = <<-YAML
    apiVersion: external-secrets.io/v1beta1
    kind: ClusterSecretStore
    metadata:
      name: gcp-secret-store
    spec:
      provider:
        gcpsm:
          projectID: ${var.project_id}
  YAML

  depends_on = [helm_release.external_secrets]
}

# --- Outputs ---

output "ingress_nginx_namespace" {
  value = var.enabled ? helm_release.ingress_nginx[0].namespace : ""
}
