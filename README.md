# Rocket.Chat.App-Tautulli

Interact with Tautulli server(s) through API.

# Deprecated

This project will no longer be maintained by me, I have retired my Rocket.Chat server in favor of a Matrix Synapse server.

## Configuration

### Channel for Recently Added
Channel (or Username) to post Recently Added content (all)
### Channel for Plex Updates
Channel (or Username) to post Plex Server Updates
### Channel for Tautulli Updates
Channel (or Username) to post Tautulli Updates
### Channel for Plex Uptime Updates
Channel (or Username) to post Plex Uptime Updates
### Recently Added Keywords Limit per User
Set a value to limit the amount of keywords to trigger on for Recently Added media.

## Docker
A Dockerfile and docker-compose are provided.

Build the docker image and run it to deploy to your server:
`docker build -t rocketchatapp_tautulli . && docker run -it --rm -e URL=YOUR_SERVER -e USERNAME=YOUR_USERNAME -e PASSWORD=YOUR_PASSWORD rocketchatapp_tautulli`

Build the docker image and run docker-compose to deploy to your server:
`docker build -t rocketchatapp_tautulli . && docker-compose run --rm -e URL=YOUR_SERVER -e USERNAME=YOUR_USERNAME -e PASSWORD=YOUR_PASSWORD rocketchatapp_tautulli`
