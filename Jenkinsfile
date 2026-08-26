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
                bat 'docker build -t Voting_Eligibility_Checker .'
            }
        }

        stage('Stop Old Container') {
            steps {
                bat 'docker stop Voting_Eligibility_Checker 2>nul || exit 0'
                bat 'docker rm Voting_Eligibility_Checker 2>nul || exit 0'
            }
        }

        stage('Run Container') {
            steps {
                bat 'docker run -d --name Voting_Eligibility_Checker -p 9091:80 Voting_Eligibility_Checker'
            }
        }
    }
}