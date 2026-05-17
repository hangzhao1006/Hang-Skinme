
cd deploy_images
pulumi stack select dev
pulumi up --stack dev -y

cd ..
cd deploy_k8s
pulumi stack select dev
pulumi up --stack dev -y
