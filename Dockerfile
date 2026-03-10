FROM nginx:alpine

# remove default nginx site config
# RUN rm /etc/nginx/conf.d/default.conf

# copy static files
COPY . /usr/share/nginx/html

EXPOSE 80
