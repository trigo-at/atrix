node('linux') {
	stage('checkout source') {
		checkout scm
	}

	def branch = sh(returnStdout: true, script: 'git branch')

	stage('services') {
		sh 'make ci-test'
	}

	if (branch == "master") {
		stage('Publish') {
			sh 'make publish'
		}
	}
}
