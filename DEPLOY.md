# Déploiement Catch'Up sur Hetzner

## Ce que je te conseille

**Docker + Nginx + Let's Encrypt (SSL)** — c'est le setup le plus fiable :
- Docker isole l'app (pas de conflit de versions Node)
- Nginx fait reverse proxy + SSL + compression + cache
- Let's Encrypt = certificat HTTPS gratuit et auto-renouvelé
- Redémarrage automatique si crash

---

## Prérequis
- Serveur Hetzner avec Linux (Ubuntu 22.04 recommandé)
- Accès SSH (root ou sudo)
- Un nom de domaine pointant vers l'IP du serveur (DNS A record)

---

## Étape 1 — Préparer le serveur

Connecte-toi en SSH :
```bash
ssh root@TON_IP
```

Installe Docker + Nginx + Certbot :
```bash
# Mise à jour
apt update && apt upgrade -y

# Docker
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose-plugin

# Nginx
apt install -y nginx

# Certbot (SSL Let's Encrypt)
apt install -y certbot python3-certbot-nginx

# Vérifie
docker --version
nginx -v
```

---

## Étape 2 — Envoyer le code sur le serveur

### Option A : Git (recommandé)
```bash
# Sur le serveur
cd /opt
git clone https://github.com/chvet/catchup.git
cd catchup
```

### Option B : SCP depuis ton PC
```bash
# Depuis ton PC Windows (PowerShell)
scp -r "C:\Users\sc\Claude code\Catchup\V0\*" root@TON_IP:/opt/catchup/
```

---

## Étape 3 — Configurer les variables d'environnement

```bash
cd /opt/catchup

# Créer le fichier .env
cat > .env << 'EOF'
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxx
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
EOF
```

---

## Étape 4 — Builder et lancer avec Docker

```bash
cd /opt/catchup

# Builder l'image (2-3 minutes la première fois)
docker compose build

# Lancer en arrière-plan
docker compose up -d

# Vérifier que ça tourne
docker compose ps
docker compose logs -f --tail 20
```

L'app tourne maintenant sur `http://TON_IP:3000`.

---

## Étape 5 — Configurer Nginx (reverse proxy)

Remplace `TON_DOMAINE` par ton vrai domaine :

```bash
cat > /etc/nginx/sites-available/catchup << 'NGINX'
server {
    listen 80;
    server_name TON_DOMAINE;

    # Sécurité
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 1000;

    # Proxy vers Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # SSE streaming (important pour le chat IA)
        proxy_buffering off;
        proxy_read_timeout 300s;
    }

    # Cache assets statiques
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
}
NGINX

# Activer le site
ln -sf /etc/nginx/sites-available/catchup /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Tester la config
nginx -t

# Recharger
systemctl reload nginx
```

L'app est maintenant accessible sur `http://TON_DOMAINE`.

---

## Étape 6 — SSL (HTTPS) avec Let's Encrypt

```bash
certbot --nginx -d TON_DOMAINE --non-interactive --agree-tos -m ton@email.com
```

Certbot modifie automatiquement la config Nginx pour ajouter HTTPS et la redirection HTTP→HTTPS.

Le certificat se renouvelle automatiquement (cron certbot).

L'app est maintenant sur **https://TON_DOMAINE** 🎉

---

## Étape 7 — Firewall

```bash
# Autoriser SSH, HTTP, HTTPS uniquement
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Vérifier
ufw status
```

Le port 3000 n'est PAS ouvert au public (Nginx fait le proxy).

---

## Commandes utiles

```bash
# Voir les logs en direct
docker compose logs -f

# Redémarrer l'app
docker compose restart

# Mettre à jour (après un git pull)
docker compose build && docker compose up -d

# Voir l'état
docker compose ps

# Entrer dans le conteneur
docker compose exec catchup sh

# Renouveler le certificat SSL (auto, mais si besoin)
certbot renew
```

---

## Mise à jour de l'app

```bash
cd /opt/catchup
git pull
docker compose build
docker compose up -d
```

Ça prend ~2 minutes. Zero downtime si tu veux : utilise `docker compose up -d --build --force-recreate`.

---

## Monitoring (optionnel)

Pour surveiller le serveur :
```bash
# Ressources
htop

# Espace disque
df -h

# Logs Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```
