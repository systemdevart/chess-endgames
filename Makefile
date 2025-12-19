DEPLOY_DIR = /var/www/endgames
SERVICE_NAME = chess-endgames

.PHONY: build deploy install stop start restart logs

build:
	npm ci
	npm run build

install:
	mkdir -p $(DEPLOY_DIR)
	cp -r dist/* $(DEPLOY_DIR)/
	cp -r database $(DEPLOY_DIR)/
	cp server.js $(DEPLOY_DIR)/
	cp package.json package-lock.json $(DEPLOY_DIR)/
	cd $(DEPLOY_DIR) && npm ci --omit=dev

stop:
	-npx pm2 stop $(SERVICE_NAME) 2>/dev/null || true

start:
	cd $(DEPLOY_DIR) && npx pm2 start server.js --name $(SERVICE_NAME)

restart:
	cd $(DEPLOY_DIR) && npx pm2 restart $(SERVICE_NAME) || $(MAKE) start

logs:
	npx pm2 logs $(SERVICE_NAME)

deploy: build stop install start
	@echo "Deployed to $(DEPLOY_DIR)"
	@echo "Site: https://endgames.chebakov.me"
