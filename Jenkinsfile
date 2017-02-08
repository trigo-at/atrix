node('linux') {
	stage('checkout source') {
		checkout scm
	}

	def branch = sh(returnStdout: true, script: 'git rev-parse --abbrev-ref HEAD')

	stage('services') {
		sh 'make ci-test'
	}

	if (branch == "master") {
		stage('Publish') {
			sh 'make publish'
		}
	}
}
