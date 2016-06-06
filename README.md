# carhouse

Garage door controller

## Run with docker

    #!/usr/bin/env bash
    PORT=3010
    DATA=/database
    export NODE_ENV='production'
    export PORT=$PORT
    export TOKEN='your particle photon access token'
    export SMSSECRET='your sms secret phrase'
    export DBFILE='/database/garage.db'
    docker run --name carhouse-running -d \
     -p $PORT:$PORT \
     -e "NODE_ENV=$NODE_ENV" \
     -e "PORT=$PORT" \
     -e "TOKEN=$TOKEN" \
     -e "SMSSECRET=$SMSSECRET" \
     -e "DBFILE=$DBFILE" \
     -v $DATA:$DATA \
     talon876/carhouse

