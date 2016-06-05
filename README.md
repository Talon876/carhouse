# carhouse

Garage door controller

## Run with docker

`docker pull talon876/carhouse`

`docker run --name carhouse-running -d -p 3010:3010 -e "NODE_ENV=production" -e "PORT=3010" -e "TOKEN=<particle.io access token>" -e 'SMSSECRET=<secret phrase>' talon876/carhouse`
