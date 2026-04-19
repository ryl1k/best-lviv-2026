FROM golang:1.25-alpine AS builder

WORKDIR /app

COPY ["go.mod","go.sum" ,"./"]

RUN go mod download

COPY . . 

RUN go build -o ./api ./cmd/api/main.go

FROM alpine

WORKDIR /

COPY --from=builder /app/api /api

CMD ["/api"]