node('linux') {
	stage('checkout source') {
		checkout scm
	}


	stage('services') {
		sh 'make ci-test'
	}

	if (env.BRANCH_NAME == "master") {
		stage('Publish') {
			sh 'make publish'
		}
	}
}
