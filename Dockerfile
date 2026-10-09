# Builds the app with Node, then serves the finished files with nginx, so
# running it needs only Docker. For development, use `make` / `yarn dev`.

FROM node:22-alpine AS build
WORKDIR /app
# Dependencies first, so they stay cached while only the source changes.
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
