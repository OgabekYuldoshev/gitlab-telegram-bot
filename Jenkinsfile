pipeline {
  agent any

  options {
    buildDiscarder(logRotator(numToKeepStr: '10'))
    timeout(time: 15, unit: 'MINUTES')
    disableConcurrentBuilds()
  }

  environment {
    IMAGE_NAME = 'gitlab-telegram-bot'
    IMAGE_TAG  = "${BUILD_NUMBER}"
  }

  parameters {
    booleanParam(
      name: 'SKIP_DEPLOY',
      defaultValue: false,
      description: 'Skip deploy (only build & test)'
    )
    string(
      name: 'DEPLOY_PATH',
      defaultValue: '/opt/gitlab-telegram-bot',
      description: 'Deploy path on server. Env vars via Portainer.'
    )
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
            export PATH="$BUN_INSTALL/bin:$PATH"
          fi

          export PATH="$HOME/.bun/bin:$PATH"
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
        script {
          def path = (params.DEPLOY_PATH ?: '/opt/gitlab-telegram-bot').trim()
          if (!path) path = '/opt/gitlab-telegram-bot'
          withEnv(["DEPLOY_PATH=${path}"]) {
            sh '''
              set -e
              DEP="${DEPLOY_PATH}"
              if [ -z "$DEP" ]; then
                echo "ERROR: DEPLOY_PATH is empty"
                exit 1
              fi
              mkdir -p "$DEP" 
              cp docker-compose.yml "$DEP/"
              cd "$DEP"
              docker compose -f docker-compose.yml up -d --force-recreate
            '''
          }
        }
      }
    }
  }

  post {
    success {
      echo "✅ Build & deploy successful: ${IMAGE_NAME}:${IMAGE_TAG}"
    }

    failure {
      echo "❌ Pipeline failed"
    }

    cleanup {
      sh '''
        docker rmi ${IMAGE_NAME}:${IMAGE_TAG} 2>/dev/null || true
      '''
    }
  }
}
