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
    string(name: 'DEPLOY_PATH', defaultValue: '/opt/gitlab-telegram-bot', description: 'Deploy path on this server. .env must exist here. Must be mounted into Jenkins container.')
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
        script {
          docker.image('docker:24').inside("-v /var/run/docker.sock:/var/run/docker.sock") {
            sh "docker build -t ${env.IMAGE_NAME}:${env.IMAGE_TAG} -t ${env.IMAGE_NAME}:latest ."
          }
        }
      }
    }

    stage('Deploy') {
      when {
        expression { return !params.SKIP_DEPLOY && params.DEPLOY_PATH?.trim() }
      }
      steps {
        script {
          def dep = params.DEPLOY_PATH.trim()
          sh """
            set -e
            mkdir -p '${dep}'
            if [ ! -f '${dep}/.env' ]; then
              echo "ERROR: ${dep}/.env not found. Create it from .env.example."
              exit 1
            fi
            cp docker-compose.yml '${dep}/'
          """
          docker.image('docker:24').inside("-v /var/run/docker.sock:/var/run/docker.sock -v ${dep}:${dep}") {
            sh "cd ${dep} && docker compose -f docker-compose.yml up -d --force-recreate"
          }
        }
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
      script {
        catchError(buildResult: 'SUCCESS', stageResult: 'SUCCESS') {
          docker.image('docker:24').inside("-v /var/run/docker.sock:/var/run/docker.sock") {
            sh "docker rmi ${env.IMAGE_NAME}:${env.IMAGE_TAG} 2>/dev/null || true"
          }
        }
      }
    }
  }
}
