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
                bat 'docker build -t voting_eligibility_checker .'
            }
        }

        stage('Stop Old Container') {
            steps {
                bat 'docker stop voting_eligibility_checker 2>nul || exit 0'
                bat 'docker rm voting_eligibility_checker 2>nul || exit 0'
            }
        }

        stage('Run Container') {
            steps {
                bat 'docker run -d --name voting_eligibility_checker -p 9091:80 voting_eligibility_checker'
            }
        }
    }
}