# HattyCRM — Setup & Configuration Guide

> **Branded CRM for Prehistoric Inc.**
> Built on [Twenty](https://twenty.com) — the open-source Salesforce alternative.

---

## Overview

HattyCRM is a self-hosted CRM platform customized for **Prehistoric Inc.** and its family of umbrella companies. It allows Jason and his team to:

- Manage contacts, companies, and deals across all Prehistoric Inc. subsidiaries in one place
- Receive and track contact form submissions from multiple company websites automatically
- Use separate **Workspaces** per subsidiary company (multi-workspace support built-in)
- Run AI-powered workflows and automations on incoming leads

---

## Architecture

```
Prehistoric Inc. (Parent)
├── Company A Website  ─→  API Webhook  ─→  HattyCRM Workspace: Company A
├── Company B Website  ─→  API Webhook  ─→  HattyCRM Workspace: Company B
├── Company C Website  ─→  API Webhook  ─→  HattyCRM Workspace: Company C
└── ...                                      (shared server, separate data)
```

Each subsidiary gets its own **Workspace** inside the same HattyCRM instance. Data is fully isolated per workspace, but the server admin (Jason) has a global admin panel view.

---

## Quick Start (Docker)

### Prerequisites
- Docker & Docker Compose installed
- A domain or subdomain pointed to your server (e.g. `crm.prehistoricinc.com`)
- A PostgreSQL-compatible database (included in Docker Compose)
- A Redis instance (included in Docker Compose)

### 1. Clone the repo

```bash
git clone https://github.com/jhatfield80/HattyCRM.git
cd HattyCRM
```

### 2. Configure environment

```bash
cd packages/twenty-docker
cp .env.example .env
```

Edit `.env` and set the following required values:

```env
# Required
SERVER_URL=https://crm.prehistoricinc.com
ENCRYPTION_KEY=<run: openssl rand -base64 32>
APP_SECRET=<run: openssl rand -base64 32>

# Set to restrict workspace creation to admins only (recommended)
IS_WORKSPACE_CREATION_LIMITED_TO_SERVER_ADMINS=true

# Enable multi-workspace support
IS_MULTIWORKSPACE_ENABLED=true

# Email (for invites and notifications)
EMAIL_FROM_ADDRESS=crm@prehistoricinc.com
EMAIL_FROM_NAME='HattyCRM - Prehistoric Inc.'
EMAIL_DRIVER=smtp
EMAIL_SMTP_HOST=your-smtp-host
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=your-smtp-user
EMAIL_SMTP_PASSWORD=your-smtp-password

# Storage (use S3 for production)
STORAGE_TYPE=local
# STORAGE_S3_REGION=us-east-1
# STORAGE_S3_NAME=hattycrm-storage
```

### 3. Start the application

```bash
docker compose up -d
```

The app will be available at `http://localhost:3000` (or your configured `SERVER_URL`).

---

## Multi-Company Setup (Prehistoric Inc. Subsidiaries)

### Step 1: Create the Admin Account

1. Open the CRM in your browser
2. Sign up with Jason's admin email
3. Go to **Settings → Admin Panel** to manage all workspaces

### Step 2: Create a Workspace Per Company

Each subsidiary company should have its own workspace:

1. Go to `https://crm.prehistoricinc.com/workspace/new`
2. Name the workspace after the subsidiary (e.g., "Dino Dig Co.", "FossilTech LLC")
3. Invite team members for that company
4. Repeat for each subsidiary

### Step 3: Connect Website Contact Forms via API

Each website can POST contact form submissions directly into the correct workspace using the Twenty REST/GraphQL API.

#### Get your API key per workspace:
1. Log into the workspace
2. Go to **Settings → API & Webhooks → API Keys**
3. Create a new API key (e.g., "Website Contact Form")
4. Copy the token

#### Example: HTML form submission to HattyCRM

Add this JavaScript to each company website's contact form:

```javascript
// Replace with the workspace-specific API key and CRM URL
const HATTYCRM_API_KEY = 'your-workspace-api-key-here';
const HATTYCRM_URL = 'https://crm.prehistoricinc.com';

async function submitToCRM(formData) {
  const response = await fetch(`${HATTYCRM_URL}/api/people`, {
      method: 'POST',
          headers: {
                'Content-Type': 'application/json',
                      'Authorization': `Bearer ${HATTYCRM_API_KEY}`
                          },
                              body: JSON.stringify({
                                    name: {
                                            firstName: formData.firstName,
                                                    lastName: formData.lastName
                                                          },
                                                                emails: {
                                                                        primaryEmail: formData.email
                                                                              },
                                                                                    phones: {
                                                                                            primaryPhoneNumber: formData.phone || ''
                                                                                                  },
                                                                                                        // Tag the source company for tracking
                                                                                                              city: formData.company || 'Website Inquiry'
                                                                                                                  })
                                                                                                                    });
                                                                                                                      return response.json();
                                                                                                                      }
                                                                                                                      
                                                                                                                      // Hook into your existing form submit event
                                                                                                                      document.getElementById('contact-form').addEventListener('submit', async (e) => {
                                                                                                                        e.preventDefault();
                                                                                                                          const data = {
                                                                                                                              firstName: document.getElementById('first-name').value,
                                                                                                                                  lastName: document.getElementById('last-name').value,
                                                                                                                                      email: document.getElementById('email').value,
                                                                                                                                          phone: document.getElementById('phone').value,
                                                                                                                                              company: 'Company A' // hardcode per website
                                                                                                                                                };
                                                                                                                                                  await submitToCRM(data);
                                                                                                                                                    // Show success message to user
                                                                                                                                                    });
                                                                                                                                                    ```
                                                                                                                                                    
                                                                                                                                                    #### Using Webhooks (alternative: push-based)
                                                                                                                                                    
                                                                                                                                                    You can also configure incoming webhooks via **Settings → API & Webhooks → Webhooks** to accept form posts from third-party services (Zapier, Make/Integromat, Gravity Forms, etc.).
                                                                                                                                                    
                                                                                                                                                    ---
                                                                                                                                                    
                                                                                                                                                    ## Branding Customization
                                                                                                                                                    
                                                                                                                                                    The HattyCRM branding has been applied to:
                                                                                                                                                    
                                                                                                                                                    | File | Change |
                                                                                                                                                    |------|--------|
                                                                                                                                                    | `packages/twenty-front/index.html` | Title, meta tags, OG/Twitter cards updated to "HattyCRM" |
                                                                                                                                                    | `README-HATTYCRM.md` | This file — setup guide |
                                                                                                                                                    
                                                                                                                                                    ### Additional branding to customize (optional):
                                                                                                                                                    
                                                                                                                                                    - **App logo**: Replace `packages/twenty-front/public/images/icons/` with Prehistoric Inc. logo files
                                                                                                                                                    - **Login page title**: Edit `packages/twenty-front/src/pages/auth/` components
                                                                                                                                                    - **Email templates**: Edit `packages/twenty-emails/src/` templates (from address, logo, colors)
                                                                                                                                                    - **Theme colors**: Edit `packages/twenty-front/src/index.css` CSS variables
                                                                                                                                                    
                                                                                                                                                    ---
                                                                                                                                                    
                                                                                                                                                    ## Workspace-Level Settings (Per Company)
                                                                                                                                                    
                                                                                                                                                    Once logged into each workspace, Jason or the workspace admin can configure:
                                                                                                                                                    
                                                                                                                                                    - **Company name & logo** → Settings → Workspace → General
                                                                                                                                                    - **Custom fields** → Settings → Data Model (add fields like "Lead Source: Company Website")
                                                                                                                                                    - **Automations** → Settings → Workflows (e.g., auto-assign new contacts to sales rep)
                                                                                                                                                    - **Email notifications** → Settings → Notifications
                                                                                                                                                    - **Connected email/calendar** → Settings → Accounts
                                                                                                                                                    
                                                                                                                                                    ---
                                                                                                                                                    
                                                                                                                                                    ## Production Checklist
                                                                                                                                                    
                                                                                                                                                    - [ ] Set strong `ENCRYPTION_KEY` and `APP_SECRET`
                                                                                                                                                    - [ ] Configure SMTP for email
                                                                                                                                                    - [ ] Enable SSL/HTTPS (use a reverse proxy like Nginx or Caddy)
                                                                                                                                                    - [ ] Set `SERVER_URL` to your public domain
                                                                                                                                                    - [ ] Set `IS_WORKSPACE_CREATION_LIMITED_TO_SERVER_ADMINS=true`
                                                                                                                                                    - [ ] Set `IS_MULTIWORKSPACE_ENABLED=true`
                                                                                                                                                    - [ ] Create one workspace per Prehistoric Inc. subsidiary
                                                                                                                                                    - [ ] Add API key to each company website's contact form
                                                                                                                                                    - [ ] (Optional) Set up S3 for file storage
                                                                                                                                                    - [ ] (Optional) Set up Sentry for error monitoring
                                                                                                                                                    
                                                                                                                                                    ---
                                                                                                                                                    
                                                                                                                                                    ## Updating HattyCRM
                                                                                                                                                    
                                                                                                                                                    To pull in upstream updates from Twenty:
                                                                                                                                                    
                                                                                                                                                    ```bash
                                                                                                                                                    git remote add upstream https://github.com/twentyhq/twenty.git
                                                                                                                                                    git fetch upstream
                                                                                                                                                    git merge upstream/main
                                                                                                                                                    # Resolve any conflicts, then push
                                                                                                                                                    git push origin main
                                                                                                                                                    ```
                                                                                                                                                    
                                                                                                                                                    ---
                                                                                                                                                    
                                                                                                                                                    ## Support & Resources
                                                                                                                                                    
                                                                                                                                                    - Twenty Docs: https://docs.twenty.com
                                                                                                                                                    - Twenty GitHub: https://github.com/twentyhq/twenty
                                                                                                                                                    - HattyCRM Repo: https://github.com/jhatfield80/HattyCRM
                                                                                                                                                    
                                                                                                                                                    ---
                                                                                                                                                    
                                                                                                                                                    *HattyCRM is a custom fork of [Twenty](https://twenty.com) (MIT License) — configured and branded for Prehistoric Inc.*
