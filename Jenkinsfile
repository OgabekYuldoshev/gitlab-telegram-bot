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
    booleanParam(name: 'SKIP_DEPLOY', defaultValue: true, description: 'Skip deploy stage (only build & test)')
    string(name: 'DEPLOY_HOST', defaultValue: '', description: 'Deploy server hostname or IP')
    string(name: 'DEPLOY_USER', defaultValue: '', description: 'SSH user on deploy server')
    string(name: 'DEPLOY_PATH', defaultValue: '/opt/gitlab-telegram-bot', description: 'App path on deploy server')
    string(name: 'DEPLOY_SSH_CREDENTIALS_ID', defaultValue: '', description: 'Jenkins credentials ID (SSH username with private key) for deploy')
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
        sh '''
          if command -v docker >/dev/null 2>&1; then
            docker build -t ''' + env.IMAGE_NAME + ''':''' + env.IMAGE_TAG + ''' -t ''' + env.IMAGE_NAME + ''':latest .
          else
            echo "Docker not found on agent, skipping image build (image will be built on deploy server if needed)"
          fi
        '''
      }
    }

    stage('Deploy') {
      when {
        expression { return !params.SKIP_DEPLOY && params.DEPLOY_HOST?.trim() && params.DEPLOY_USER?.trim() }
      }
      steps {
        script {
          def credId = params.DEPLOY_SSH_CREDENTIALS_ID?.trim()
          def doDeploy = {
            sh "rsync -avz --delete --exclude '.git' --exclude 'node_modules' --exclude '.env' ./ ${params.DEPLOY_USER}@${params.DEPLOY_HOST}:${params.DEPLOY_PATH}/"
            sh "ssh -o StrictHostKeyChecking=no ${params.DEPLOY_USER}@${params.DEPLOY_HOST} 'cd ${params.DEPLOY_PATH} && docker compose up -d --build'"
          }
          if (credId) {
            sshagent(credentials: [credId]) { doDeploy() }
          } else {
            doDeploy()
          }
        }
      }
    }
  }

  post {
    success {
      echo "Build ${IMAGE_NAME}:${IMAGE_TAG} completed."
    }
    failure {
      echo "Build failed."
    }
    cleanup {
      sh 'command -v docker >/dev/null 2>&1 && docker rmi ' + env.IMAGE_NAME + ':' + env.IMAGE_TAG + ' ' + env.IMAGE_NAME + ':latest 2>/dev/null || true'
    }
  }
}
