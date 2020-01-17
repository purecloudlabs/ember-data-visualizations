@Library('pipeline-library@webapp-pipelines') _

webappPipeline {
    slaveLabel = 'dev'
    useArtifactoryRepo = false
    projectName = 'ember-data-visualizations'
    manifest = directoryManifest('dist')
    buildType = { env.BRANCH_NAME == 'master' ? 'MAINLINE' : 'FEATURE' }
    publishPackage = { 'dev' }
    shouldDeployDev = { false }
    shouldDeployTest = { false }
    shouldTestProd = { false }

    buildStep = {
        version = env.BRANCH_NAME == 'master' ? env.VERSION : env.BRANCH_NAME

        sh("""
            export CDN_URL="\$(npx cdn --ecosystem pc --name \$APP_NAME --build \$BUILD_ID --version ${version})"
            echo "CDN_URL \$CDN_URL"
            yarn --pure-lockfile && yarn test && yarn run build-prod
        """)
    }

    upsertCMStep = {
        sh('''
            echo "Skipping CM creation as this is an internal addon."
        ''')
    }
}
