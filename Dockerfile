# # production stage
# FROM nginx:stable-alpine as production-stage
# COPY /dist /usr/share/nginx/html
# # COPY /dist /
# EXPOSE 80
# CMD ["nginx", "-g", "daemon off;"]

FROM socialengine/nginx-spa:latest

# Cache buster - forces Docker to rebuild from this point
ARG CACHEBUST=1760681999
RUN echo "Cache bust: $CACHEBUST"

COPY /dist /app
RUN chmod -R 777 /app
