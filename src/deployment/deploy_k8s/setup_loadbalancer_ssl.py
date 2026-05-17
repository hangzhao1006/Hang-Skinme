import pulumi_gcp as gcp

# from pulumi import StackReference, ResourceOptions, Output
from pulumi import ResourceOptions
import pulumi_kubernetes as k8s


def setup_loadbalancer_ssl(namespace, k8s_provider, api_service, frontend_service, app_name, domain):

    # Get a global ip address
    ip_address = gcp.compute.GlobalAddress(
        "global-static-ip",
        name="skincare-app-global-ip",
        address_type="EXTERNAL",
        ip_version="IPV4",
    )
    # For SSL mode, use custom domain if provided, otherwise use sslip.io
    if domain:
        cert_domain = domain
        host = ip_address.address.apply(lambda ip: domain)  # Return domain as Output
    else:
        # Use sslip.io with the static IP
        host = ip_address.address.apply(lambda ip: f"{ip}.sslip.io")
        cert_domain = host

    # Build list of hosts for Ingress (can have multiple)
    def build_hosts(ip):
        hosts = [f"{ip}.sslip.io"]
        if domain:
            hosts.append(domain)
        return hosts

    # Create Certificate - GKE ManagedCertificate only supports ONE domain
    managed_cert = k8s.apiextensions.CustomResource(
        "managed-cert",
        api_version="networking.gke.io/v1beta1",
        kind="ManagedCertificate",
        metadata={
            "name": "managed-certificates",
            "namespace": namespace.metadata.name,
        },
        spec={"domains": [cert_domain]},  # Only use custom domain for SSL certificate
        opts=ResourceOptions(provider=k8s_provider, depends_on=[ip_address]),
    )

    # Frontend Config
    frontend_config = k8s.apiextensions.CustomResource(
        "https-redirect",
        api_version="networking.gke.io/v1beta1",
        kind="FrontendConfig",
        metadata={
            "name": "https-redirect",
            "namespace": namespace.metadata.name,
        },
        spec={"redirectToHttps": {"enabled": True}},
        opts=ResourceOptions(provider=k8s_provider, depends_on=[managed_cert]),
    )

    # Define the common paths for both hosts
    common_paths = [
        # API service
        k8s.networking.v1.HTTPIngressPathArgs(
            path="/api-service",
            path_type="Prefix",
            backend=k8s.networking.v1.IngressBackendArgs(
                service=k8s.networking.v1.IngressServiceBackendArgs(
                    name=api_service.metadata["name"],
                    port=k8s.networking.v1.ServiceBackendPortArgs(number=8080),
                )
            ),
        ),
        # Frontend
        k8s.networking.v1.HTTPIngressPathArgs(
            path="/",
            path_type="Prefix",
            backend=k8s.networking.v1.IngressBackendArgs(
                service=k8s.networking.v1.IngressServiceBackendArgs(
                    name=frontend_service.metadata["name"],
                    port=k8s.networking.v1.ServiceBackendPortArgs(number=3001),
                )
            ),
        ),
    ]

    # Build Ingress rules for all hosts
    def build_ingress_rules(host_list):
        return [
            k8s.networking.v1.IngressRuleArgs(
                host=h, http=k8s.networking.v1.HTTPIngressRuleValueArgs(paths=common_paths)
            )
            for h in host_list
        ]

    # Loadbalancer and redirects to services
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
        opts=ResourceOptions(
            provider=k8s_provider,
            depends_on=[managed_cert, frontend_config],
        ),
    )

    return ip_address.address, ingress, host
