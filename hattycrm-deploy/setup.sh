#!/usr/bin/env bash
# =============================================================
# HattyCRM First-Time Setup Script
# Prehistoric Inc. — Automated Deployment
# =============================================================
# Usage: bash setup.sh
# Run from the hattycrm-deploy/ directory

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo -e "${GREEN}=================================================${NC}"
echo -e "${GREEN}   HattyCRM Setup — Prehistoric Inc.            ${NC}"
echo -e "${GREEN}=================================================${NC}"
echo ""

# Check Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}ERROR: Docker is not installed.${NC}"
        echo "Install Docker first: https://docs.docker.com/get-docker/"
            exit 1
            fi

            # Check Docker Compose is available
            if ! docker compose version &> /dev/null; then
                echo -e "${RED}ERROR: Docker Compose is not available.${NC}"
                    echo "Install Docker Compose: https://docs.docker.com/compose/install/"
                        exit 1
                        fi

                        echo -e "${GREEN}✓ Docker and Docker Compose found${NC}"
                        echo ""

                        # Create .env if it doesn't exist
                        if [ ! -f .env ]; then
                            echo -e "${YELLOW}Creating .env from template...${NC}"
                                cp .env.hattycrm .env
                                    echo -e "${GREEN}✓ .env file created${NC}"
                                    else
                                        echo -e "${YELLOW}⚠ .env already exists, skipping copy${NC}"
                                        fi

                                        # Generate secure keys
                                        echo ""
                                        echo -e "${YELLOW}Generating secure encryption keys...${NC}"
                                        ENCRYPTION_KEY=$(openssl rand -base64 32)
                                        APP_SECRET=$(openssl rand -base64 32)
                                        DB_PASSWORD=$(openssl rand -hex 16)

                                        # Update .env with generated keys
                                        if [[ "$OSTYPE" == "darwin"* ]]; then
                                            # macOS
                                                sed -i '' "s|CHANGE_ME_run_openssl_rand_base64_32|${ENCRYPTION_KEY}|1" .env
                                                    sed -i '' "s|CHANGE_ME_run_openssl_rand_base64_32|${APP_SECRET}|1" .env
                                                        sed -i '' "s|CHANGE_ME_strong_db_password|${DB_PASSWORD}|" .env
                                                        else
                                                            # Linux
                                                                sed -i "s|CHANGE_ME_run_openssl_rand_base64_32|${ENCRYPTION_KEY}|1" .env
                                                                    sed -i "s|CHANGE_ME_run_openssl_rand_base64_32|${APP_SECRET}|1" .env
                                                                        sed -i "s|CHANGE_ME_strong_db_password|${DB_PASSWORD}|" .env
                                                                        fi

                                                                        echo -e "${GREEN}✓ Secure keys generated and written to .env${NC}"

                                                                        # Prompt for domain/URL
                                                                        echo ""
                                                                        echo -e "${YELLOW}What is the URL where HattyCRM will be hosted?${NC}"
                                                                        echo "  Examples:"
                                                                        echo "    http://localhost:3000           (local testing)"
                                                                        echo "    https://crm.prehistoricinc.com  (production)"
                                                                        echo ""
                                                                        read -p "Enter SERVER_URL [http://localhost:3000]: " USER_URL
                                                                        USER_URL="${USER_URL:-http://localhost:3000}"

                                                                        if [[ "$OSTYPE" == "darwin"* ]]; then
                                                                            sed -i '' "s|SERVER_URL=http://localhost:3000|SERVER_URL=${USER_URL}|" .env
                                                                            else
                                                                                sed -i "s|SERVER_URL=http://localhost:3000|SERVER_URL=${USER_URL}|" .env
                                                                                fi

                                                                                echo -e "${GREEN}✓ SERVER_URL set to: ${USER_URL}${NC}"

                                                                                # Pull latest images
                                                                                echo ""
                                                                                echo -e "${YELLOW}Pulling Docker images (this may take a few minutes)...${NC}"
                                                                                docker compose pull

                                                                                echo ""
                                                                                echo -e "${YELLOW}Starting HattyCRM services...${NC}"
                                                                                docker compose up -d

                                                                                # Wait for health check
                                                                                echo ""
                                                                                echo -e "${YELLOW}Waiting for services to become healthy...${NC}"
                                                                                ATTEMPTS=0
                                                                                MAX_ATTEMPTS=40
                                                                                until docker compose exec -T server curl -sf http://localhost:3000/healthz > /dev/null 2>&1 || [ $ATTEMPTS -ge $MAX_ATTEMPTS ]; do
                                                                                    ATTEMPTS=$((ATTEMPTS+1))
                                                                                        echo -n "."
                                                                                            sleep 5
                                                                                            done

                                                                                            echo ""

                                                                                            if [ $ATTEMPTS -ge $MAX_ATTEMPTS ]; then
                                                                                                echo -e "${YELLOW}Services are taking longer than expected to start.${NC}"
                                                                                                    echo "Check status with: docker compose logs -f server"
                                                                                                    else
                                                                                                        echo -e "${GREEN}✓ HattyCRM is running!${NC}"
                                                                                                        fi
                                                                                                        
                                                                                                        echo ""
                                                                                                        echo -e "${GREEN}=================================================${NC}"
                                                                                                        echo -e "${GREEN}   HattyCRM is ready!                           ${NC}"
                                                                                                        echo -e "${GREEN}=================================================${NC}"
                                                                                                        echo ""
                                                                                                        echo -e "  App URL:      ${GREEN}${USER_URL}${NC}"
                                                                                                        echo -e "  Admin Panel:  ${GREEN}${USER_URL}/admin-panel${NC}"
                                                                                                        echo ""
                                                                                                        echo -e "${YELLOW}NEXT STEPS:${NC}"
                                                                                                        echo "  1. Open ${USER_URL} in your browser"
                                                                                                        echo "  2. Create your admin account"
                                                                                                        echo "  3. Go to Admin Panel > Workspaces to create one workspace per company"
                                                                                                        echo "  4. In each workspace: Settings > API Keys > create a key for the website"
                                                                                                        echo "  5. Add the API key to each company website's contact form"
                                                                                                        echo ""
                                                                                                        echo -e "${YELLOW}View logs:${NC}  docker compose logs -f"
                                                                                                        echo -e "${YELLOW}Stop:${NC}       docker compose down"
                                                                                                        echo -e "${YELLOW}Restart:${NC}    docker compose restart"
                                                                                                        echo ""
