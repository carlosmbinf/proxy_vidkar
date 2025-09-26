module.exports = {
  apps : [{
    name: "vidkar_connector",
    script: "npm run proxy:dev",
    env: {
      NODE_ENV: "development",
      "ROOT_URL": "https://srv5119-206152.vps.etecsa.cu:5000/",
      "PORT": 80,
    },
    env_production: {
      NODE_ENV: "production",
    }
  }]
}
