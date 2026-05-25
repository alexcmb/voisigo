# ============================================================
# deploy.ps1 - Script de deploiement VoisiGO vers VM Azure
# Usage : .\deploy.ps1
# ============================================================
param(
    [string]$Key = "terraform\private_key.pem"
)

$ErrorActionPreference = "Stop"

# Recuperation de l'IP de la VM depuis le state Terraform
Write-Host "Recuperation de l'IP Terraform..." -ForegroundColor Cyan
$IP = terraform -chdir=terraform output -raw vm_public_ip 2>$null

if (-not $IP -or $IP -eq "") {
    Write-Error "Impossible de recuperer l'IP. Lance 'terraform apply' d'abord."
    exit 1
}

Write-Host "Deploiement vers $IP avec la cle $Key" -ForegroundColor Cyan

# ---- 1. Creation d'une archive legere (sans node_modules) ----
Write-Host "[1/3] Creation de l'archive du code source..." -ForegroundColor Yellow
tar.exe -czf deploy_package.tar.gz `
    --exclude=node_modules `
    --exclude=dist `
    --exclude=.git `
    docker-compose.yml `
    frontend `
    backend

Write-Host "Archive creee : $('{0:N2}' -f ((Get-Item deploy_package.tar.gz).Length / 1MB)) MB"

# ---- 2. Transfert SSH de l'archive ----
Write-Host "[2/3] Transfert des fichiers vers la VM..." -ForegroundColor Yellow
scp -i $Key -o StrictHostKeyChecking=no deploy_package.tar.gz "ubuntu@${IP}:/home/ubuntu/deploy_package.tar.gz"

# Nettoyage de l'archive locale
Remove-Item deploy_package.tar.gz -Force

# ---- 3. Extraction + Docker build + lancement sur le serveur ----
Write-Host "[3/3] Build et lancement des conteneurs..." -ForegroundColor Yellow
$RemoteScript = @"
set -e
echo '-- Extraction du code --'
mkdir -p /home/ubuntu/voisigo
tar -xzf /home/ubuntu/deploy_package.tar.gz -C /home/ubuntu/voisigo
rm /home/ubuntu/deploy_package.tar.gz

echo '-- Build Docker (sans cache) --'
cd /home/ubuntu/voisigo
docker compose build --no-cache

echo '-- Lancement des conteneurs --'
docker compose up -d

echo '-- Done --'
"@

ssh -i $Key -o StrictHostKeyChecking=no "ubuntu@${IP}" $RemoteScript

Write-Host ""
Write-Host "Deploiement termine !" -ForegroundColor Green
Write-Host "Frontend : http://$IP/"
Write-Host "Backend  : http://${IP}:3000/"
