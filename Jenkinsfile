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
                echo "🚀 Yangi versiya ishga tushirilmoqda..."
                sh """
                    docker stop ${CONTAINER_NAME} || true
                    docker rm ${CONTAINER_NAME} || true
                    docker run -d --name ${CONTAINER_NAME} -p ${PORT}:80 ${IMAGE_NAME}:${BUILD_ID}
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