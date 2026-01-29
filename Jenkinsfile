pipeline {
    agent any

    environment {
        IMAGE_NAME = 'gitlab-telegram-bot'
        CONTAINER_NAME = 'gitlab-telegram-bot'
        PORT = '3013'
    }

    stages {
        stage('Checkout') {
            steps {
                echo "📦 Kod yuklanmoqda..."
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "🔨 Docker image yaratilmoqda..."
                sh "docker build -t ${IMAGE_NAME}:${BUILD_ID} ."
            }
        }

        stage('Deploy') {
            steps {
                echo "🚀 Docker Compose orqali deploy qilinmoqda..."
                sh """
                    export BUILD_ID=${BUILD_ID}
                    docker compose up --help
                    docker compose up -d
                """
            }
        }
    }

    post {
        success {
            echo "✅ Build va deploy muvaffaqiyatli yakunlandi!"
        }
        failure {
            echo "❌ Build yoki deploy jarayonida xatolik yuz berdi."
        }
    }
}
