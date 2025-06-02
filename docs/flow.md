# Basic service template

Represents minimal scratch golang microservice with http REST API

## Configuration

Creates singleton service configuration to use across app and ease to extend.

## Routing

Use "github.com/gorilla/mux" router and configure routes as mentioned: 

- /liveness - observability stub route
- /readiness - observability stub route
- /metrics - returns prometheus metrics

## Logging

Expose slog as logging library

## Delivery

Scratch Dockerfile using go 1.24 to build and create app containers