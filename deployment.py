# =============================================================================
# SkinMe AI — Deployment 完整代码合并文件
# 目录结构：src/deployment/
# 包含：
#   deploy_images/__main__.py   — Pulumi: 构建并推送 Docker 镜像到 Artifact Registry
#   deploy_k8s/__main__.py      — Pulumi: GKE 集群部署入口
#   deploy_k8s/create_network.py  — VPC + Subnet + Router + NAT
#   deploy_k8s/create_cluster.py  — GKE 集群 + 节点池 + Workload Identity
#   deploy_k8s/setup_containers.py — K8s Deployment + Service (frontend + api)
#   deploy_k8s/setup_loadbalancer.py     — Nginx Ingress (HTTP)
#   deploy_k8s/setup_loadbalancer_ssl.py — GKE Managed Certificate (HTTPS)
#   Dockerfile       — 部署容器镜像（含 gcloud / kubectl / helm / pulumi）
#   docker-entrypoint.sh — 容器启动脚本（gcloud 认证 + pulumi login）
#   deploy-k8s-ssl.sh    — 一键 SSL 部署脚本
# =============================================================================


# =============================================================================
# FILE: src/deployment/deploy_images/__main__.py
# 作用：Pulumi 程序 — 构建 api-service 和 frontend Docker 镜像并推送到
#       GCP Artifact Registry（地址：{REGION}-docker.pkg.dev/{PROJECT}/skincare-app-repository）
# =============================================================================

import os
import pulumi
import pulumi_docker_build as docker_build
from pulumi import CustomTimeouts
import datetime

project = pulumi.Config("gcp").require("project")
location = os.environ["GCP_REGION"]

timestamp_tag = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
repository_name = "skincare-app-repository"
registry_url = f"{location}-docker.pkg.dev/{project}/{repository_name}"

# Build + Push: API Service
api_service_image = docker_build.Image(
    "build-skincare-app-api-service",
    tags=[pulumi.Output.concat(registry_url, "/skincare-app-api-service:", timestamp_tag)],
    context=docker_build.BuildContextArgs(location="../../api-service"),
    dockerfile={"location": "../../api-service/Dockerfile"},
    platforms=[docker_build.Platform.LINUX_AMD64],
    push=True,
    opts=pulumi.ResourceOptions(custom_timeouts=CustomTimeouts(create="30m"), retain_on_delete=True),
)
pulumi.export("skincare-app-api-service-ref", api_service_image.ref)
pulumi.export("skincare-app-api-service-tags", api_service_image.tags)

# Build + Push: Frontend
frontend_image = docker_build.Image(
    "build-skincare-app-frontend",
    tags=[pulumi.Output.concat(registry_url, "/skincare-app-frontend:", timestamp_tag)],
    context=docker_build.BuildContextArgs(location="../../frontend"),
    dockerfile={"location": "../../frontend/Dockerfile"},
    platforms=[docker_build.Platform.LINUX_AMD64],
    push=True,
    build_args={"NO_CACHE": timestamp_tag},  # Force rebuild via timestamp build arg
    opts=pulumi.ResourceOptions(custom_timeouts=CustomTimeouts(create="30m"), retain_on_delete=True),
)
pulumi.export("skincare-app-frontend-ref", frontend_image.ref)
pulumi.export("skincare-app-frontend-tags", frontend_image.tags)


# =============================================================================
# FILE: src/deployment/deploy_k8s/__main__.py
# 作用：Pulumi 部署入口 — 编排网络 / 集群 / 容器 / 负载均衡器
#       通过 Pulumi config 控制是否启用 SSL：
#         pulumi config set deploy-k8s:setupSSL true
#         pulumi config set deploy-k8s:domain skinthecode.com
# =============================================================================

import pulumi
from create_network import create_network
from create_cluster import create_cluster
from setup_containers import setup_containers
from setup_loadbalancer import setup_loadbalancer
from setup_loadbalancer_ssl import setup_loadbalancer_ssl

gcp_config = pulumi.Config("gcp")
project = gcp_config.get("project")
region = "us-central1"
app_name = "skincare-app"

deploy_k8s = pulumi.Config("deploy-k8s")
setupSSL = deploy_k8s.get_bool("setupSSL") or False
domain = deploy_k8s.get("domain")

# Step 1: VPC + Subnet + Router + NAT
network, subnet, router, nat = create_network(region, app_name)

# Step 2: GKE Cluster + Node Pool + Workload Identity
cluster, namespace, k8s_provider, ksa_name = create_cluster(project, region, network, subnet, app_name)

# Step 3: K8s Deployments + Services
frontend_service, api_service = setup_containers(project, namespace, k8s_provider, ksa_name, app_name)

# Step 4: Ingress / Load Balancer
if setupSSL:
    ip_address, ingress, host = setup_loadbalancer_ssl(
        namespace, k8s_provider, api_service, frontend_service, app_name, domain)
    app_url = host.apply(lambda dmn: f"https://{dmn}")
else:
    ip_address, ingress, host = setup_loadbalancer(
        namespace, k8s_provider, api_service, frontend_service, app_name, domain)
    app_url = host.apply(lambda dmn: f"http://{dmn}")

pulumi.export("cluster_name", cluster.name)
pulumi.export("cluster_endpoint", cluster.endpoint)
pulumi.export("kubeconfig", k8s_provider.kubeconfig)
pulumi.export("namespace", namespace.metadata.name)
pulumi.export("ingress_name", ingress.metadata.name)
pulumi.export("ip_address", ip_address)
pulumi.export("app_url", app_url)


# =============================================================================
# FILE: src/deployment/deploy_k8s/create_network.py
# 作用：创建 GCP VPC 网络基础设施
#   - VPC：skincare-app-vpc（manual subnet，regional routing）
#   - Subnet：10.0.0.0/19，启用 private Google access
#   - Cloud Router：启用 NAT，让私有节点访问公网
# =============================================================================

import pulumi
import pulumi_gcp as gcp


def create_network(region, app_name):
    # Custom VPC with manual subnet config
    network = gcp.compute.Network(
        f"{app_name}-vpc",
        name=f"{app_name}-vpc",
        auto_create_subnetworks=False,      # Manual subnet management
        routing_mode="REGIONAL",
        description="VPC for Kubernetes Cluster",
    )

    subnet = gcp.compute.Subnetwork(
        f"{app_name}-subnet",
        name=f"{app_name}-subnet",
        ip_cidr_range="10.0.0.0/19",
        region=region,
        network=network.id,
        private_ip_google_access=True,      # Allow GCS/BigQuery access from private nodes
        description="subnet /19 starting after 10.0.0.0/19",
        opts=pulumi.ResourceOptions(depends_on=[network]),
    )

    router = gcp.compute.Router(
        f"{app_name}-router",
        name=f"{app_name}-router",
        network=network.id,
        region=region,
        opts=pulumi.ResourceOptions(depends_on=[network, subnet]),
    )

    # NAT: allows private nodes to reach the internet (e.g., pull images)
    nat = gcp.compute.RouterNat(
        f"{app_name}-nat",
        name=f"{app_name}-nat",
        router=router.name,
        region=region,
        nat_ip_allocate_option="AUTO_ONLY",
        source_subnetwork_ip_ranges_to_nat="ALL_SUBNETWORKS_ALL_IP_RANGES",
        log_config=gcp.compute.RouterNatLogConfigArgs(enable=True, filter="ERRORS_ONLY"),
        opts=pulumi.ResourceOptions(depends_on=[router]),
    )

    return network, subnet, router, nat


# =============================================================================
# FILE: src/deployment/deploy_k8s/create_cluster.py
# 作用：创建 GKE 集群和节点池
#   - 私有节点（private IPs），公网控制面
#   - Workload Identity：KSA → GSA 映射，Pod 无需 key 文件访问 GCP
#   - 节点规格：n2d-standard-2，50GB，1-2 节点自动扩缩
#   - Gateway API（CHANNEL_STANDARD）
# =============================================================================

import pulumi
import pulumi_gcp as gcp
from pulumi import ResourceOptions, Output
import pulumi_kubernetes as k8s
import pulumi_command as command
import yaml

base_config = pulumi.Config()
service_account_email = pulumi.Config("security").get("gcp_service_account_email")
ksa_service_account_email = pulumi.Config("security").get("gcp_ksa_service_account_email")
machine_type = "n2d-standard-2"
machine_disk_size = 50


def create_cluster(project, region, network, subnet, app_name):
    cluster = gcp.container.Cluster(
        f"{app_name}-cluster",
        name=f"{app_name}-cluster",
        description="GKE cluster",
        location=region,
        deletion_protection=False,
        network=network.name,
        subnetwork=subnet.name,
        remove_default_node_pool=True,      # Use custom node pool below
        node_config={"service_account": service_account_email},
        initial_node_count=1,
        private_cluster_config={
            "enable_private_nodes": True,           # Nodes use private IPs only
            "enable_private_endpoint": False,        # Control plane accessible via public endpoint
            "master_ipv4_cidr_block": "172.0.0.0/28",
        },
        workload_identity_config={"workload_pool": f"{project}.svc.id.goog"},
        gateway_api_config={"channel": "CHANNEL_STANDARD"},
    )

    node_pool = gcp.container.NodePool(
        f"{app_name}-pool",
        cluster=cluster.name,
        location=region,
        initial_node_count=1,
        node_config=gcp.container.NodePoolNodeConfigArgs(
            service_account=service_account_email,
            machine_type=machine_type,
            image_type="cos_containerd",    # Container-Optimized OS
            disk_size_gb=machine_disk_size,
            oauth_scopes=[
                "https://www.googleapis.com/auth/devstorage.read_only",
                "https://www.googleapis.com/auth/logging.write",
                "https://www.googleapis.com/auth/monitoring",
                "https://www.googleapis.com/auth/servicecontrol",
                "https://www.googleapis.com/auth/service.management.readonly",
                "https://www.googleapis.com/auth/trace.append",
            ],
        ),
        autoscaling=gcp.container.NodePoolAutoscalingArgs(min_node_count=1, max_node_count=2),
        management=gcp.container.NodePoolManagementArgs(auto_repair=True, auto_upgrade=True),
        node_locations=["us-central1-a"],
    )

    # Build kubeconfig from cluster output
    k8s_info = pulumi.Output.all(cluster.name, cluster.endpoint, cluster.master_auth)

    def make_kubeconfig(info):
        cluster_name, endpoint, master_auth = info
        context_name = f"{project}_{region}_{cluster_name}"
        kubeconfig = {
            "apiVersion": "v1", "kind": "Config",
            "clusters": [{"name": context_name, "cluster": {
                "certificate-authority-data": master_auth["cluster_ca_certificate"],
                "server": f"https://{endpoint}",
            }}],
            "contexts": [{"name": context_name, "context": {"cluster": context_name, "user": context_name}}],
            "current-context": context_name,
            "users": [{"name": context_name, "user": {"exec": {
                "apiVersion": "client.authentication.k8s.io/v1beta1",
                "command": "gke-gcloud-auth-plugin",
                "installHint": "Install gke-gcloud-auth-plugin for use with kubectl",
                "provideClusterInfo": True, "interactiveMode": "Never",
            }}}],
        }
        return yaml.dump(kubeconfig, default_flow_style=False)

    cluster_kubeconfig = k8s_info.apply(make_kubeconfig)

    k8s_provider = k8s.Provider("gke_k8s_v2", kubeconfig=cluster_kubeconfig,
                                 opts=ResourceOptions(depends_on=[node_pool]))

    namespace = k8s.core.v1.Namespace(
        f"{app_name}-namespace",
        metadata={"name": f"{app_name}-namespace"},
        opts=ResourceOptions(provider=k8s_provider),
    )

    # Kubernetes Service Account (KSA) with Workload Identity annotation
    # Allows pods to impersonate GSA and access GCP without embedded keys
    ksa_name = "api-ksa"
    k8s.core.v1.ServiceAccount(
        "api-ksa",
        metadata=k8s.meta.v1.ObjectMetaArgs(
            name=ksa_name,
            namespace=namespace.metadata["name"],
            annotations={"iam.gke.io/gcp-service-account": f"{ksa_service_account_email}"},
        ),
        opts=ResourceOptions(provider=k8s_provider),
    )

    project_id = gcp.config.project
    wi_member = Output.concat(
        "serviceAccount:", project_id, ".svc.id.goog[",
        namespace.metadata["name"], "/", ksa_name, "]",
    )
    gsa_full_id = pulumi.Output.concat("projects/", project_id, "/serviceAccounts/", f"{ksa_service_account_email}")
    gcp.serviceaccount.IAMMember(
        "api-gsa-wi-user",
        service_account_id=gsa_full_id,
        role="roles/iam.workloadIdentityUser",  # Required role for Workload Identity
        member=wi_member,
    )

    command.local.Command(
        "connect-k8s-command",
        create=Output.concat(
            "gcloud container clusters get-credentials ", cluster.name,
            f" --zone {region} --project {project}"),
    )

    return cluster, namespace, k8s_provider, ksa_name


# =============================================================================
# FILE: src/deployment/deploy_k8s/setup_containers.py
# 作用：创建 K8s Deployment 和 Service
#   frontend: port 3001，CPU 250m-500m，Memory 2-3Gi
#   api:      port 8080，使用 KSA，挂载 5Gi PVC
#   镜像从 deploy_images Pulumi stack 获取（StackReference）
#   DATA_SOURCE=jsonl（可改为 sql 使用 PostgreSQL）
# =============================================================================

import pulumi
import pulumi_kubernetes as k8s


def setup_containers(project, namespace, k8s_provider, ksa_name, app_name):
    images_stack = pulumi.StackReference("organization/deploy-images/dev")
    api_service_tag = images_stack.get_output("skincare-app-api-service-tags")
    frontend_tag = images_stack.get_output("skincare-app-frontend-tags")

    # Shared persistent storage (5Gi) for API service
    persistent_pvc = k8s.core.v1.PersistentVolumeClaim(
        "persistent-pvc",
        metadata=k8s.meta.v1.ObjectMetaArgs(name="persistent-pvc", namespace=namespace.metadata.name),
        spec=k8s.core.v1.PersistentVolumeClaimSpecArgs(
            access_modes=["ReadWriteOnce"],
            resources=k8s.core.v1.VolumeResourceRequirementsArgs(requests={"storage": "5Gi"}),
        ),
        opts=pulumi.ResourceOptions(provider=k8s_provider, depends_on=[namespace]),
    )

    # --- Frontend ---
    frontend_deployment = k8s.apps.v1.Deployment(
        "frontend",
        metadata=k8s.meta.v1.ObjectMetaArgs(name="frontend", namespace=namespace.metadata.name),
        spec=k8s.apps.v1.DeploymentSpecArgs(
            selector=k8s.meta.v1.LabelSelectorArgs(match_labels={"run": "frontend"}),
            template=k8s.core.v1.PodTemplateSpecArgs(
                metadata=k8s.meta.v1.ObjectMetaArgs(labels={"run": "frontend"}),
                spec=k8s.core.v1.PodSpecArgs(containers=[
                    k8s.core.v1.ContainerArgs(
                        name="frontend",
                        image=frontend_tag.apply(lambda tags: tags[0]),
                        image_pull_policy="Always",
                        ports=[k8s.core.v1.ContainerPortArgs(container_port=3001, protocol="TCP")],
                        resources=k8s.core.v1.ResourceRequirementsArgs(
                            requests={"cpu": "250m", "memory": "2Gi"},
                            limits={"cpu": "500m", "memory": "3Gi"},
                        ),
                    ),
                ]),
            ),
        ),
        opts=pulumi.ResourceOptions(provider=k8s_provider, depends_on=[namespace]),
    )

    frontend_service = k8s.core.v1.Service(
        "frontend-service",
        metadata=k8s.meta.v1.ObjectMetaArgs(name="frontend", namespace=namespace.metadata.name),
        spec=k8s.core.v1.ServiceSpecArgs(
            type="ClusterIP",
            ports=[k8s.core.v1.ServicePortArgs(port=3001, target_port=3001, protocol="TCP")],
            selector={"run": "frontend"},
        ),
        opts=pulumi.ResourceOptions(provider=k8s_provider, depends_on=[frontend_deployment]),
    )

    # --- API Service ---
    api_deployment = k8s.apps.v1.Deployment(
        "api",
        metadata=k8s.meta.v1.ObjectMetaArgs(name="api", namespace=namespace.metadata.name),
        spec=k8s.apps.v1.DeploymentSpecArgs(
            selector=k8s.meta.v1.LabelSelectorArgs(match_labels={"run": "api"}),
            template=k8s.core.v1.PodTemplateSpecArgs(
                metadata=k8s.meta.v1.ObjectMetaArgs(labels={"run": "api"}),
                spec=k8s.core.v1.PodSpecArgs(
                    service_account_name=ksa_name,          # Workload Identity KSA
                    security_context=k8s.core.v1.PodSecurityContextArgs(fs_group=1000),
                    volumes=[k8s.core.v1.VolumeArgs(
                        name="persistent-vol",
                        persistent_volume_claim=k8s.core.v1.PersistentVolumeClaimVolumeSourceArgs(
                            claim_name=persistent_pvc.metadata.name),
                    )],
                    containers=[k8s.core.v1.ContainerArgs(
                        name="api",
                        image=api_service_tag.apply(lambda tags: tags[0]),
                        image_pull_policy="IfNotPresent",
                        ports=[k8s.core.v1.ContainerPortArgs(container_port=8080, protocol="TCP")],
                        volume_mounts=[k8s.core.v1.VolumeMountArgs(
                            name="persistent-vol", mount_path="/persistent")],
                        env=[
                            k8s.core.v1.EnvVarArgs(name="GCP_PROJECT", value=project),
                            k8s.core.v1.EnvVarArgs(name="PORT", value="8080"),
                            k8s.core.v1.EnvVarArgs(name="ROOT_PATH", value="/api-service"),
                            k8s.core.v1.EnvVarArgs(name="GOOGLE_CLOUD_LOCATION", value="us-east4"),
                            k8s.core.v1.EnvVarArgs(
                                name="RAG_CORPUS",
                                value="projects/ac215-herm/locations/us-east4/ragCorpora/4611686018427387904",
                            ),
                            k8s.core.v1.EnvVarArgs(name="BUCKET_NAME", value="ac215-skincare"),
                            k8s.core.v1.EnvVarArgs(name="GCS_IMAGE_PREFIX", value="user_image"),
                            k8s.core.v1.EnvVarArgs(name="GEMINI_MODEL", value="gemini-2.0-flash"),
                            # DATA_SOURCE: "jsonl" uses GCS JSONL file; "sql" uses PostgreSQL
                            k8s.core.v1.EnvVarArgs(name="DATA_SOURCE", value="jsonl"),
                            # PostgreSQL config (only used when DATA_SOURCE=sql)
                            k8s.core.v1.EnvVarArgs(name="DB_HOST", value="localhost"),  # Cloud SQL Proxy sidecar
                            k8s.core.v1.EnvVarArgs(name="DB_PORT", value="5432"),
                            k8s.core.v1.EnvVarArgs(name="DB_NAME", value="postgres"),
                            k8s.core.v1.EnvVarArgs(name="DB_USER", value="postgres"),
                            k8s.core.v1.EnvVarArgs(name="DB_PASSWORD", value=os.getenv("DB_PASSWORD", "")),
                        ],
                    )],
                ),
            ),
        ),
        opts=pulumi.ResourceOptions(provider=k8s_provider, depends_on=[namespace]),
    )

    api_service = k8s.core.v1.Service(
        "api-service",
        metadata=k8s.meta.v1.ObjectMetaArgs(name="api", namespace=namespace.metadata.name),
        spec=k8s.core.v1.ServiceSpecArgs(
            type="ClusterIP",
            ports=[k8s.core.v1.ServicePortArgs(port=8080, target_port=8080, protocol="TCP")],
            selector={"run": "api"},
        ),
        opts=pulumi.ResourceOptions(provider=k8s_provider, depends_on=[api_deployment]),
    )

    return frontend_service, api_service


# =============================================================================
# FILE: src/deployment/deploy_k8s/setup_loadbalancer.py
# 作用：HTTP 模式负载均衡（非 SSL）
#   使用 F5 Nginx Ingress Controller（Helm chart）
#   路由规则：/api-service → api:8080，/ → frontend:3001
#   域名：{IP}.sslip.io（或自定义 domain）
# =============================================================================

import pulumi
from pulumi import ResourceOptions
import pulumi_kubernetes as k8s


def setup_loadbalancer(namespace, k8s_provider, api_service, frontend_service, app_name, domain):
    nginx_helm = k8s.helm.v3.Release(
        "nginx-f5",
        chart="nginx-ingress",
        version="2.3.1",
        namespace=namespace.metadata.name,
        repository_opts=k8s.helm.v3.RepositoryOptsArgs(repo="https://helm.nginx.com/stable"),
        values={
            "controller": {
                "service": {"type": "LoadBalancer"},
                "resources": {
                    "requests": {"memory": "128Mi", "cpu": "100m"},
                    "limits": {"memory": "256Mi", "cpu": "200m"},
                },
                "replicaCount": 1,
                "ingressClass": {"name": "nginx", "create": True, "setAsDefaultIngress": True},
            },
        },
        opts=ResourceOptions(provider=k8s_provider),
    )

    nginx_service = k8s.core.v1.Service.get(
        "nginx-ingress-service",
        pulumi.Output.concat(nginx_helm.status.namespace, "/",
                             nginx_helm.status.name, "-nginx-ingress-controller"),
        opts=pulumi.ResourceOptions(provider=k8s_provider, depends_on=[nginx_helm]),
    )
    ip_address = nginx_service.status.load_balancer.ingress[0].ip

    host = ip_address.apply(lambda ip: domain if domain else f"{ip}.sslip.io")

    def build_hosts(ip):
        hosts = [f"{ip}.sslip.io"]
        if domain:
            hosts.append(domain)
        return hosts

    common_paths = [
        k8s.networking.v1.HTTPIngressPathArgs(
            path="/api-service", path_type="Prefix",
            backend=k8s.networking.v1.IngressBackendArgs(
                service=k8s.networking.v1.IngressServiceBackendArgs(
                    name=api_service.metadata["name"],
                    port=k8s.networking.v1.ServiceBackendPortArgs(number=8080))),
        ),
        k8s.networking.v1.HTTPIngressPathArgs(
            path="/", path_type="Prefix",
            backend=k8s.networking.v1.IngressBackendArgs(
                service=k8s.networking.v1.IngressServiceBackendArgs(
                    name=frontend_service.metadata["name"],
                    port=k8s.networking.v1.ServiceBackendPortArgs(number=3001))),
        ),
    ]

    def build_ingress_rules(host_list):
        return [k8s.networking.v1.IngressRuleArgs(
            host=h, http=k8s.networking.v1.HTTPIngressRuleValueArgs(paths=common_paths))
            for h in host_list]

    ingress = k8s.networking.v1.Ingress(
        f"{app_name}-ingress",
        metadata=k8s.meta.v1.ObjectMetaArgs(
            name=f"{app_name}-ingress",
            namespace=namespace.metadata.name,
            annotations={
                "cert-manager.io/cluster-issuer": "letsencrypt-prod",
                "ingress.kubernetes.io/ssl-redirect": "false",
                "nginx.org/client-max-body-size": "10m",
            },
        ),
        spec=k8s.networking.v1.IngressSpecArgs(
            ingress_class_name="nginx",
            rules=ip_address.apply(build_hosts).apply(build_ingress_rules),
        ),
        opts=ResourceOptions(provider=k8s_provider, depends_on=[nginx_helm]),
    )

    return ip_address, ingress, host


# =============================================================================
# FILE: src/deployment/deploy_k8s/setup_loadbalancer_ssl.py
# 作用：HTTPS 模式负载均衡（GKE Managed Certificate）
#   - 静态全球 IP（GCP Global Address）
#   - GKE ManagedCertificate（自动申请 Let's Encrypt）
#   - FrontendConfig：强制 HTTP → HTTPS 重定向
#   - GCE Ingress（kubernetes.io/ingress.class: gce）
# =============================================================================

import pulumi_gcp as gcp
from pulumi import ResourceOptions
import pulumi_kubernetes as k8s


def setup_loadbalancer_ssl(namespace, k8s_provider, api_service, frontend_service, app_name, domain):
    ip_address = gcp.compute.GlobalAddress(
        "global-static-ip",
        name="skincare-app-global-ip",
        address_type="EXTERNAL",
        ip_version="IPV4",
    )

    cert_domain = domain if domain else ip_address.address.apply(lambda ip: f"{ip}.sslip.io")
    host = ip_address.address.apply(lambda ip: domain if domain else f"{ip}.sslip.io")

    managed_cert = k8s.apiextensions.CustomResource(
        "managed-cert",
        api_version="networking.gke.io/v1beta1",
        kind="ManagedCertificate",
        metadata={"name": "managed-certificates", "namespace": namespace.metadata.name},
        spec={"domains": [cert_domain]},
        opts=ResourceOptions(provider=k8s_provider, depends_on=[ip_address]),
    )

    # Force HTTP → HTTPS redirect
    frontend_config = k8s.apiextensions.CustomResource(
        "https-redirect",
        api_version="networking.gke.io/v1beta1",
        kind="FrontendConfig",
        metadata={"name": "https-redirect", "namespace": namespace.metadata.name},
        spec={"redirectToHttps": {"enabled": True}},
        opts=ResourceOptions(provider=k8s_provider, depends_on=[managed_cert]),
    )

    common_paths = [
        k8s.networking.v1.HTTPIngressPathArgs(
            path="/api-service", path_type="Prefix",
            backend=k8s.networking.v1.IngressBackendArgs(
                service=k8s.networking.v1.IngressServiceBackendArgs(
                    name=api_service.metadata["name"],
                    port=k8s.networking.v1.ServiceBackendPortArgs(number=8080))),
        ),
        k8s.networking.v1.HTTPIngressPathArgs(
            path="/", path_type="Prefix",
            backend=k8s.networking.v1.IngressBackendArgs(
                service=k8s.networking.v1.IngressServiceBackendArgs(
                    name=frontend_service.metadata["name"],
                    port=k8s.networking.v1.ServiceBackendPortArgs(number=3001))),
        ),
    ]

    def build_hosts(ip):
        hosts = [f"{ip}.sslip.io"]
        if domain:
            hosts.append(domain)
        return hosts

    def build_ingress_rules(host_list):
        return [k8s.networking.v1.IngressRuleArgs(
            host=h, http=k8s.networking.v1.HTTPIngressRuleValueArgs(paths=common_paths))
            for h in host_list]

    ingress = k8s.networking.v1.Ingress(
        f"{app_name}-ingress",
        metadata=k8s.meta.v1.ObjectMetaArgs(
            name=f"{app_name}-ingress",
            namespace=namespace.metadata.name,
            annotations={
                "kubernetes.io/ingress.class": "gce",
                "kubernetes.io/ingress.global-static-ip-name": ip_address.name,
                "networking.gke.io/managed-certificates": "managed-certificates",
                "networking.gke.io/v1beta1.frontend-config": "https-redirect",
            },
        ),
        spec=k8s.networking.v1.IngressSpecArgs(
            rules=ip_address.address.apply(build_hosts).apply(build_ingress_rules),
        ),
        opts=ResourceOptions(provider=k8s_provider, depends_on=[managed_cert, frontend_config]),
    )

    return ip_address.address, ingress, host


# =============================================================================
# FILE: src/deployment/Dockerfile
# 作用：部署容器镜像，包含所有运维工具：
#   - gcloud CLI + gke-gcloud-auth-plugin
#   - kubectl (v1.34)
#   - Helm (latest)
#   - Pulumi (latest)
#   - Docker CLI
#   - Python + UV
# 使用方式：docker run -v secrets:/secrets -e GOOGLE_APPLICATION_CREDENTIALS=/secrets/key.json ...
# =============================================================================

DOCKERFILE_CONTENT = """
FROM python:3.13-slim-bullseye

ENV DEBIAN_FRONTEND=noninteractive
ENV UV_PROJECT_ENVIRONMENT=/home/app/.venv

RUN apt-get update && \\
    apt-get install -y curl apt-transport-https ca-certificates gnupg lsb-release openssh-client

# Google Cloud SDK
RUN echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | \\
    tee -a /etc/apt/sources.list.d/google-cloud-sdk.list && \\
    curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | \\
    gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg

# Docker
RUN install -m 0755 -d /etc/apt/keyrings && \\
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg && \\
    chmod a+r /etc/apt/keyrings/docker.gpg && \\
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \\
    https://download.docker.com/linux/debian $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \\
    tee /etc/apt/sources.list.d/docker.list > /dev/null

RUN apt-get update && apt-get install -y google-cloud-sdk google-cloud-sdk-gke-gcloud-auth-plugin jq docker-ce

# kubectl v1.34
ARG K8S_MINOR=1.34
RUN install -m 0755 -d /etc/apt/keyrings \\
    && curl -fsSL "https://pkgs.k8s.io/core:/stable:/v${K8S_MINOR}/deb/Release.key" \\
    | gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg \\
    && chmod 0644 /etc/apt/keyrings/kubernetes-apt-keyring.gpg \\
    && echo "deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] \\
    https://pkgs.k8s.io/core:/stable:/v${K8S_MINOR}/deb/ /" \\
    | tee /etc/apt/sources.list.d/kubernetes.list \\
    && apt-get update && apt-get install -y --no-install-recommends kubectl

# Helm
RUN curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Pulumi
RUN curl -fsSL https://get.pulumi.com | sh
ENV PATH="$PATH:/root/.pulumi/bin"
ENV PULUMI_CONFIG_PASSPHRASE=""

# UV
RUN pip install uv
ENV PATH="$PATH:/root/.local/bin"

RUN useradd -ms /bin/bash app -d /home/app -u 1000 -p "$(openssl passwd -1 passw0rd)" && \\
    usermod -aG docker app && mkdir -p /app && chown app:app /app

WORKDIR /app
COPY --chown=app:app pyproject.toml uv.lock* ./
RUN uv sync --frozen
COPY --chown=app:app docker-entrypoint.sh /bin/docker-entrypoint.sh
RUN chmod +x /bin/docker-entrypoint.sh
ENTRYPOINT ["/bin/bash","/bin/docker-entrypoint.sh"]
"""

# =============================================================================
# FILE: src/deployment/docker-entrypoint.sh
# 作用：容器启动入口脚本
#   1. gcloud 认证（Service Account key）
#   2. 配置 Artifact Registry Docker 登录
#   3. 创建/检查 Pulumi state bucket（GCS）
#   4. pulumi login 到 GCS bucket
#   5. 进入交互式 bash
# 环境变量：GOOGLE_APPLICATION_CREDENTIALS, GCP_PROJECT, PULUMI_BUCKET
# =============================================================================

DOCKER_ENTRYPOINT_SH = """
#!/bin/bash

echo "Container is running!!!"
echo "Architecture: $(uname -m)"

# Authenticate gcloud using service account key
gcloud auth activate-service-account --key-file $GOOGLE_APPLICATION_CREDENTIALS
gcloud config set project $GCP_PROJECT

# Login to Artifact Registry for Docker image push
gcloud auth configure-docker us-docker.pkg.dev --quiet

# Create Pulumi state bucket if it doesn't exist
if ! gsutil ls -b $PULUMI_BUCKET >/dev/null 2>&1; then
    echo "Bucket does not exist. Creating..."
    gsutil mb -p $GCP_PROJECT $PULUMI_BUCKET
else
    echo "Bucket already exists. Skipping creation."
fi

echo "Logging into Pulumi using GCS bucket: $PULUMI_BUCKET"
pulumi login $PULUMI_BUCKET

echo "Available Pulumi stacks in GCS:"
gsutil ls $PULUMI_BUCKET/.pulumi/stacks/ || echo "No stacks found."

/bin/bash
"""

# =============================================================================
# FILE: src/deployment/deploy-k8s-ssl.sh
# 作用：一键 HTTPS 部署脚本
#   Step 1: deploy_images stack (dev) — 构建推送镜像
#   Step 2: deploy_k8s stack (ssl) — 部署 K8s + SSL 证书
#   Step 3: deploy_k8s stack (dev) — 同步 HTTP 版本
# 执行后需手动配置 DNS A 记录指向静态 IP，等待 10-20 min 证书签发
# =============================================================================

DEPLOY_SSL_SH = """
#!/bin/bash

echo "🔒 Deploying with HTTPS/SSL enabled..."

# Step 1: Build and push Docker images
cd deploy_images
echo "📦 Building and pushing container images..."
pulumi stack select dev
pulumi up --stack dev -y

# Step 2: Deploy to K8s with SSL
cd ../deploy_k8s
echo "🚀 Deploying to Kubernetes with SSL...(https)"
pulumi stack select ssl
pulumi up --stack ssl -y

echo "🚀 Deploying to Kubernetes (dev, http)..."
pulumi stack select dev
pulumi up --stack dev -y

echo ""
echo "✅ Deployment complete!"
echo "📝 Next steps:"
echo "1. Get the static IP address from the output"
echo "2. Add DNS A record pointing skinthecode.com to that IP"
echo "3. Wait 10-20 minutes for SSL certificate provisioning"
echo "4. Access your app at: https://skinthecode.com"
"""
