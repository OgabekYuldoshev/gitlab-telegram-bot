pipeline {
  agent any

  options {
    buildDiscarder(logRotator(numToKeepStr: '10'))
    timeout(time: 20, unit: 'MINUTES')
    disableConcurrentBuilds()
    timestamps()
  }

  environment {
    IMAGE_NAME = 'gitlab-telegram-bot'
    IMAGE_TAG  = "${BUILD_NUMBER}"
    BUN_INSTALL = "$HOME/.bun"
    PATH = "$HOME/.bun/bin:$PATH"
    DEPLOY_PATH = "${params.DEPLOY_PATH ?: '/opt/gitlab-telegram-bot'}"
  }

  parameters {
    booleanParam(
      name: 'SKIP_DEPLOY',
      defaultValue: false,
      description: 'Only build & test'
    )
    string(
      name: 'DEPLOY_PATH',
      defaultValue: '/opt/gitlab-telegram-bot',
      description: 'Deploy path'
    )
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Test (Bun)') {
      steps {
        sh '''
          set -e
          if ! command -v bun >/dev/null 2>&1; then
            curl -fsSL https://bun.sh/install | bash
          fi
          bun install --frozen-lockfile
          bun test
        '''
      }
    }

    stage('Build Docker Image') {
      steps {
        sh '''
          set -e
          docker build \
            -t ${IMAGE_NAME}:${IMAGE_TAG} \
            -t ${IMAGE_NAME}:latest \
            .
        '''
      }
    }

    stage('Deploy') {
      when {
        expression { !params.SKIP_DEPLOY }
      }
      steps {
        sh '''
          set -e

          mkdir -p "$DEPLOY_PATH"
          cp docker-compose.yml "$DEPLOY_PATH/"
          cd "$DEPLOY_PATH"

          echo "🚀 Deploying with docker-compose..."
          docker compose up -d --force-recreate
        '''
      }
    }

    stage('Health Check') {
      when {
        expression { !params.SKIP_DEPLOY }
      }
      steps {
        sh '''
          set -e
          echo "⏳ Waiting for healthcheck..."

          for i in {1..15}; do
            STATUS=$(docker inspect \
              --format='{{.State.Health.Status}}' \
              gitlab-telegram-bot || echo "starting")

            if [ "$STATUS" = "healthy" ]; then
              echo "✅ Service is healthy"
              exit 0
            fi

            echo "Status: $STATUS ($i/15)"
            sleep 5
          done

          docker logs gitlab-telegram-bot || true
          exit 1
        '''
      }
    }
  }

  post {
    success {
      echo "✅ Deploy successful: ${IMAGE_NAME}:${IMAGE_TAG}"
    }

    failure {
      echo "❌ Pipeline failed"
    }

    cleanup {
      sh '''
        docker image rm ${IMAGE_NAME}:${IMAGE_TAG} 2>/dev/null || true
      '''
    }
  }
}
