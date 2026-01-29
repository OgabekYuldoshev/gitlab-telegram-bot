pipeline {
  agent any

  options {
    buildDiscarder(logRotator(numToKeepStr: '10'))
    timeout(time: 15, unit: 'MINUTES')
    disableConcurrentBuilds()
  }

  environment {
    IMAGE_NAME = 'gitlab-telegram-bot'
    IMAGE_TAG = "${env.BUILD_NUMBER}"
  }

  parameters {
    booleanParam(name: 'SKIP_DEPLOY', defaultValue: false, description: 'Skip deploy (only build & test)')
    string(name: 'DEPLOY_PATH', defaultValue: '/opt/gitlab-telegram-bot', description: 'Deploy path on this server (Jenkins + Docker host). .env must exist here.')
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Test') {
      steps {
        sh '''
          set -e
          if ! command -v bun >/dev/null 2>&1; then
            echo "Installing Bun..."
            curl -fsSL https://bun.sh/install | bash
            export BUN_INSTALL="$HOME/.bun"
            export PATH="$HOME/.bun/bin:$PATH"
          fi
          bun install --frozen-lockfile
          bun test
        '''
      }
    }

    stage('Build Docker') {
      steps {
        sh "docker build -t ${env.IMAGE_NAME}:${env.IMAGE_TAG} -t ${env.IMAGE_NAME}:latest ."
      }
    }

    stage('Deploy') {
      when {
        expression { return !params.SKIP_DEPLOY && params.DEPLOY_PATH?.trim() }
      }
      steps {
        sh """
          set -e
          DEPLOY_PATH='${params.DEPLOY_PATH}'
          mkdir -p "\$DEPLOY_PATH"
          if [ ! -f "\$DEPLOY_PATH/.env" ]; then
            echo "ERROR: \$DEPLOY_PATH/.env not found. Create it from .env.example (TELEGRAM_TOKEN, GITLAB_SECRET_TOKEN, GITLAB_TELEGRAM_CHAT_MAPPING, etc.)"
            exit 1
          fi
          cp docker-compose.yml "\$DEPLOY_PATH/"
          cd "\$DEPLOY_PATH" && docker compose -f docker-compose.yml up -d --force-recreate
        """
      }
    }
  }

  post {
    success {
      echo "Build ${env.IMAGE_NAME}:${env.IMAGE_TAG} completed."
    }
    failure {
      echo "Build failed."
    }
    cleanup {
      sh "docker rmi ${env.IMAGE_NAME}:${env.IMAGE_TAG} 2>/dev/null || true"
    }
  }
}
