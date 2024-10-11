#!/bin/bash
set -e
ips=(
    "65.109.183.121"

)
current_ip=$(curl -s https://ipinfo.io/ip)
is_ip_whitelisted() {
    for ip in "${ips[@]}"; do
        if [[ "$ip" == "$current_ip" ]]; then
            return 0
        fi
    done
    return 1
}
if is_ip_whitelisted; then
    echo "Starting KNP installation..."
else
    echo "********"
    exit 1
fi
ports=(5000 3000 443 80)
for port in "${ports[@]}"
do
    if lsof -i :$port >/dev/null; then
        echo "Error: Port $port is already in use."
        exit 1
    fi
done
echo "All required ports are free."
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root or use sudo."
    exit
fi
if [ -x "$(command -v docker)" ]; then
    echo "Docker is already installed."
else
    echo "Docker is not installed. Installing..."
    curl -fsSL https://get.docker.com | sh
fi
if [ -x "$(command -v git)" ]; then
    echo "Git is already installed."
else
    echo "Git is not installed. Installing..."
    sudo apt update && sudo apt install -y git
fi
if [ -x "$(command -v certbot)" ]; then
    echo "Certbot is already installed."
else
    echo "Installing Certbot..."
    sudo apt install -y certbot python3-certbot-nginx
fi
cd /root
if [ -d "knp" ]; then
    echo "Directory knp already exists."
else
    git clone https://github.com/ahwazi12/kn-panel.git knp
fi
cd knp
echo "Building Docker image for knp_backend..."
docker build -t knp_backend .
docker run -it -v /root/knp/.env:/knp_backend/.env -v /root/knp/backup_config.json
:/knp_backend/backup_config.json -v /root/knp/main.conf:/knp_backend/main.conf --e
ntrypoint "node" knp_backend config.js
DOMAINS=$(docker run -it -v /root/knp/.env:/knp_backend/.env -v /root/knp/backup_c
onfig.json:/knp_backend/backup_config.json --entrypoint "node" knp_backend get_cer
t_urls.js)
PANEL_DOMAIN=$(echo "$DOMAINS" | grep "PANEL_DOMAIN:" | awk -F': ' '{print $2}')
SUBLINK_DOMAIN=$(echo "$DOMAINS" | grep "SUBLINK_DOMAIN:" | awk -F': ' '{print $2}
')
if sudo systemctl is-active --quiet nginx; then
    echo "Stopping Nginx..."
    sudo systemctl stop nginx
fi
sudo certbot certonly --standalone -d "$PANEL_DOMAIN" -d "$SUBLINK_DOMAIN" --non-i
nteractive --agree-tos --email knpanelbackup@gmail.com
docker compose build
docker compose up -d
sleep 3
docker exec -it mongo-knp mongosh KN_PANEL --eval 'db.accounts.insertOne({ "id": 1
00000000, "is_admin": 1, "password": "123456", "username": "admin", "tokens": [],
"sub_accounts": [] })'
chmod +x cli.sh
# sudo mv cli.sh /usr/local/bin/knp
sudo ln -s /root/knp/cli.sh /usr/local/bin/knp
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
echo -e "${GREEN}Installation complete.${NC} ${YELLOW}Use 'knp' command to manage
the service.${NC}"
# domains
# telegram bot
# openssl enc -aes-256-cbc -salt -in install_org.sh -out install.sh -pass pass:no_
one_will_know
# curl -fsSL https://raw.githubusercontent.com/ahwazi12/kn-panel/main/install.sh
-o install.sh && bash -c "$(openssl enc -d -aes-256-cbc -in install.sh -pass pass:
no_one_will_know)"
# marzban commands
# rm -rf /root/install.sh && rm -rf /root/knp/ && docker stop $(docker ps -a -q) &
& docker rm $(docker ps -a -q) && docker rmi $(docker images -a -q) -f