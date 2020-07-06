FROM golang:1.14-stretch AS builder

# Set necessary environmet variables needed for our image
# ENV GO111MODULE=on \
#     CGO_ENABLED=0 \
#     GOOS=linux \
#     GOARCH=amd64

# # Move to working directory /build
# WORKDIR /build

# # Copy and download dependency using go mod
# COPY go.mod .
# COPY go.sum .
# RUN go mod download

# # Copy the code into the container
# COPY . .

# # Build the application
# RUN go build -o main .

# # Move to /dist directory as the place for resulting binary folder
# WORKDIR /

# # Copy binary from build to main folder
# RUN cp /build/main .

# # Export necessary port
# EXPOSE 8080

# # Command to run when starting the container
# CMD [ "./main" ]

# Build the Go API
#FROM golang:latest AS builder
ADD . /app
# Set necessary environmet variables needed for our image
ENV GO111MODULE=on \
    CGO_ENABLED=0 \
    GOOS=linux \
    GOARCH=amd64
    
WORKDIR /app
RUN go mod download

RUN go build -ldflags "-w" -a -o /main .
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