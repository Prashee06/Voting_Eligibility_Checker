pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                bat 'docker build -t memory-game .'
            }
        }

        stage('Stop Old Container') {
            steps {
                bat 'docker stop memorygame 2>nul || exit 0'
                bat 'docker rm memorygame 2>nul || exit 0'
            }
        }

        stage('Run Container') {
            steps {
                bat 'docker run -d --name memorygame -p 9091:80 memory-game'
            }
        }
    }
}
