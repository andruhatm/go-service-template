FROM golang:1.24-alpine AS build
LABEL authors="Andrey"

RUN apk add --no-cache git

WORKDIR /live

COPY go.mod .
COPY go.sum .

RUN go mod download

COPY . .

RUN go build -o ./out/app .

EXPOSE 8081

CMD ["./out/app"]