# Build time
FROM node:18-alpine as build
WORKDIR /app
COPY . .
RUN npm install --legacy-peer-deps --force && npm run build

# Run time
FROM nginx
COPY --from=build /app/dist /usr/share/nginx/html
COPY ./nginx/ /etc/nginx/templates/
#COPY nginx.conf /etc/nginx/conf.d/default.conf
