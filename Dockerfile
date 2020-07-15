FROM golang:1.14-stretch AS builder

ADD . /app
# Set necessary environmet variables needed for our image
ENV GO111MODULE=on \
    CGO_ENABLED=0 \
    GOOS=linux \
    GOARCH=amd64
    
WORKDIR /app
RUN go mod download

RUN go build -ldflags "-w" -a -o /main .

FROM builder AS dev
RUN go get github.com/githubnemo/CompileDaemon
ENTRYPOINT CompileDaemon --build="go build main.go" --command=./runserver

# Build the React application
FROM node:alpine AS node_builder
COPY --from=builder /app/src/client ./
RUN npm install
RUN npm run build
# Final stage build, this will be the container
# that we will deploy to production
FROM alpine:latest
RUN apk --no-cache add ca-certificates
COPY --from=builder /main ./
COPY --from=builder /app/src/templates ./src/templates/
COPY --from=node_builder /build ./web
RUN chmod +x ./main
EXPOSE 8080
CMD ./main