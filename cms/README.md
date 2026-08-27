# Directus Headless CMS & PostgreSQL Stack

This directory contains the self-hosted Directus CMS infrastructure for the Edge AI research group website.

## Prerequisites
- Docker & Docker Compose v2+
- Python 3.8+ (for schema auto-initialization script)

## Quick Start (3 Steps)

### 1. Configure Environment Variables
```bash
cp .env.example .env
# Edit .env to set your preferred admin password and secure secret keys
```

### 2. Launch Docker Services
```bash
docker compose up -d
```
Directus will start on `http://127.0.0.1:8055`.

### 3. Bootstrap Collections & Public Permissions
Run the automated schema bootstrapper to create all collections (`members`, `projects`, `publications`, `theses`, `teaching_courses`, `vacancies`, `news_events`, `site_settings`):
```bash
pip install requests
python3 schema/bootstrap_directus.py
```

## Admin Portal
- **URL**: `http://localhost:8055` (or `https://cms.yourdomain.com`)
- **Admin Email**: `admin@uibk-edgeai.ac.at`
- **Default Password**: `AdminEdgeAI2026!` (configured in `.env`)

## Collection Overview (Strict Typing, No WYSIWYG)
- **Members**: Structured roles (Professor, PostDoc, PhD, Systems Engineer), contact details, academic IDs (ORCID, Scholar), nested positions and education history.
- **Projects**: Ongoing and completed research projects, sponsor tags, duration, and researcher links.
- **Publications**: Full BibTeX metadata, DOI, arXiv URLs, and PDF attachments.
- **Theses**: Student theses (Bachelor, Master, PhD) with supervisor links and status tracking.
- **Teaching Courses**: Courses with semester, room, instructors, and LFU online links.
- **Vacancies**: Open job postings with requirements and application contact.
- **Site Settings**: Homepage motivation text, research topics, and hero carousel.
