# Build time
FROM node:18-alpine as build
WORKDIR /app
COPY . .
RUN npm install --force  && npm run build
#RUN npm install --legacy-peer-deps  && npm run build
#RUN npm ci && npm run build

# Run time
FROM nginx
COPY --from=build /app/build/ /usr/share/nginx/html/app/
COPY ./nginx/ /etc/nginx/templates/
#COPY nginx.conf /etc/nginx/conf.d/default.conf
