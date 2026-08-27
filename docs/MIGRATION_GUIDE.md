# Edge AI Website: Directus CMS & Astro Architecture Guide

This comprehensive guide explains the new decoupled architecture, self-hosting deployment on Proxmox VMs, strict schema forms, data migration, and automated build pipelines.

---

## 1. System Architecture Overview

```
                          ┌────────────────────────────────┐
                          │     Directus Headless CMS      │
                          │   (PostgreSQL 16 + Redis)      │
                          │  https://cms.edgeai.uibk.ac.at │
                          └───────────────┬────────────────┘
                                          │
                  Directus Webhook Event  │  (Items Created/Updated/Deleted)
                                          ▼
                          ┌────────────────────────────────┐
                          │    Webhook Builder Listener    │
                          │      (:9000 / Node.js)         │
                          └───────────────┬────────────────┘
                                          │
                                          │ Triggers `npm run build`
                                          ▼
                          ┌────────────────────────────────┐
                          │    Astro Static Site Builder   │
                          │  (Compiles HTML/CSS/JS Assets) │
                          └───────────────┬────────────────┘
                                          │
                                          │ Syncs `dist/` folder
                                          ▼
                          ┌────────────────────────────────┐
                          │      Nginx Web Server          │
                          │   (HTTP/2, Let's Encrypt SSL)  │
                          │   https://edgeai.uibk.ac.at    │
                          └────────────────────────────────┘
```

---

## 2. Directory Structure

```
website/
├── cms/                              # Directus CMS & Database Stack
│   ├── docker-compose.yml            # PostgreSQL 16 + Redis + Directus v11
│   ├── .env.example                  # Environment secrets template
│   ├── schema/
│   │   ├── schema_definition.json    # Strict schema definitions (no WYSIWYG)
│   │   └── bootstrap_directus.py     # Auto-creates collections, fields & permissions
│   └── README.md
│
├── frontend/                         # Modern Astro Static Frontend
│   ├── package.json
│   ├── astro.config.mjs
│   ├── src/
│   │   ├── components/               # Navbar, Footer, Cards, Carousel, etc.
│   │   ├── layouts/                  # BaseLayout with SEO & BibTeX Modal
│   │   ├── pages/                    # Home, Team, Projects, Publications, Teaching, etc.
│   │   ├── lib/                      # Directus SDK & TypeScript interfaces
│   │   └── styles/                   # Dark mode high-tech CSS design system
│   └── public/                       # Images, logos, and BibTeX assets
│
├── migration/                        # Jekyll to Directus Migration
│   ├── migrate_to_directus.py        # Parses markdown, YAML frontmatter, BibTeX
│   └── requirements.txt
│
├── deploy/                           # Production Infrastructure
│   ├── nginx/                        # Nginx virtual host configs (Frontend, CMS, Webhook)
│   ├── webhook-builder/              # Automated build listener service
│   └── systemd/                      # Systemd units for automated boot & restart
│
└── docs/
    └── MIGRATION_GUIDE.md
```

---

## 3. Step-by-Step Server Setup (Proxmox / Ubuntu)

### Step 3.1: Launch Directus CMS
```bash
cd /path/to/website/cms
cp .env.example .env
# Edit .env to set your preferred admin password and secure secret keys
docker compose up -d
```
Directus is now running on `http://127.0.0.1:8055`.

### Step 3.2: Bootstrap Collections & Permissions
Run the automated schema bootstrapper to create typed collections (`members`, `projects`, `publications`, `theses`, `teaching_courses`, `vacancies`, `news_events`, `site_settings`):
```bash
python3 /path/to/website/cms/schema/bootstrap_directus.py
```

### Step 3.3: Import Legacy Jekyll Content
Run the migration script to parse all Jekyll markdown files and push them into the system:
```bash
python3 /path/to/website/migration/migrate_to_directus.py
```

---

## 4. Setting Up the Automated Build Webhook

Whenever a group member clicks **"Save"** or **"Publish"** in Directus, Directus fires a webhook that automatically rebuilds the Astro static frontend.

### Step 4.1: Install & Enable Webhook Service
```bash
cd /path/to/website/deploy/webhook-builder
npm install
sudo cp ../systemd/edgeai-webhook.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now edgeai-webhook.service
```

### Step 4.2: Configure Webhook in Directus UI
1. Log in to Directus Admin (`https://cms.edgeai.uibk.ac.at`) as Administrator.
2. Go to **Settings** &rarr; **Webhooks** &rarr; **Create Webhook (+)**.
3. Configure the following fields:
   - **Name**: `Astro Static Site Rebuilder`
   - **Status**: `Active`
   - **Method**: `POST`
   - **URL**: `http://127.0.0.1:9000/webhook/directus`
   - **Trigger**: `Event Hook`
   - **Events**: Check `items.create`, `items.update`, `items.delete`
   - **Collections**: Select `members`, `projects`, `publications`, `theses`, `teaching_courses`, `vacancies`, `news_events`, `site_settings`
   - **Headers**:
     - Key: `X-Webhook-Secret`
     - Value: `super_secret_build_trigger_token_2026` (matching `.env`)
4. Click **Save**.

---

## 5. Nginx Reverse Proxy & SSL Certificates

### Step 5.1: Copy Nginx Configurations
```bash
sudo cp deploy/nginx/edgeai-frontend.conf /etc/nginx/sites-available/
sudo cp deploy/nginx/edgeai-cms.conf /etc/nginx/sites-available/
sudo cp deploy/nginx/edgeai-webhook.conf /etc/nginx/sites-available/

sudo ln -s /etc/nginx/sites-available/edgeai-frontend.conf /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/edgeai-cms.conf /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/edgeai-webhook.conf /etc/nginx/sites-enabled/
```

### Step 5.2: Issue Let's Encrypt SSL Certificates
```bash
sudo certbot --nginx -d edgeai.uibk.ac.at -d www.edgeai.uibk.ac.at -d cms.edgeai.uibk.ac.at -d webhook.edgeai.uibk.ac.at
sudo nginx -t && sudo systemctl reload nginx
```

---

## 6. How Group Members Add & Edit Content (Non-Technical Guide)

Research group members **do not need to touch Git or code**. They log in to `https://cms.edgeai.uibk.ac.at` and fill out strict form fields:

### 1. Adding a New Team Member
- Navigate to **Members** &rarr; **Create Item (+)**.
- **Title**: e.g., `Univ.-Prof. Dr. Radu Prodan`
- **Role Category**: Choose from dropdown (`Professor`, `Postdoctoral Researcher`, `PhD Student`, `Systems Engineer`).
- **Office / Phone / Email**: Clean text inputs.
- **Academic IDs**: Enter ORCID (`0000-0002-8247-5426`) and Google Scholar ID.
- **Profile Photo**: Click to upload image file.
- **Interests**: Type tags and press Enter (`Edge AI`, `Graph Neural Networks`).
- Click **Save**. The website automatically rebuilds!

### 2. Adding a New Research Project
- Navigate to **Projects** &rarr; **Create Item (+)**.
- **Status**: Dropdown (`Ongoing` or `Completed`).
- **Project Name & Title**: Text inputs.
- **Sponsor**: e.g., `Austrian Research Promotion Agency (FFG)`.
- **Duration**: e.g., `2025 – 2030`.
- **Cover Image**: Upload logo/banner image.
- **Summary**: 1-2 sentence overview.
- Click **Save**.

### 3. Adding a Publication
- Navigate to **Publications** &rarr; **Create Item (+)**.
- **BibTeX Key**: e.g., `Prodan2026-EdgeCloud`.
- **Publication Type**: Select `Journal Article`, `Conference Paper`, etc.
- **Title, Authors, Year, Venue, DOI**: Standard text fields.
- **BibTeX Code**: Paste raw BibTeX for 1-click citation export on the website.
- Click **Save**.

### 4. Adding a Student Thesis Topic
- Navigate to **Theses** &rarr; **Create Item (+)**.
- **Degree**: Select `Bachelor Thesis` or `Master Thesis`.
- **Status**: Select `Open / Available Topic` (for prospective students) or `Ongoing` / `Completed`.
- **Supervisors**: Select faculty member.
- **Abstract**: Problem description and requirements.
- Click **Save**.
