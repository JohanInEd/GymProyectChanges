# syntax=docker/dockerfile:1

##########################################################################
# GymSaaS frontend - static React/Vite build served by Nginx
# (build context = ./frontend, same convention as backend/Dockerfile)
##########################################################################

########################################
# 1) Build
########################################
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

########################################
# 2) Runtime
########################################
FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
