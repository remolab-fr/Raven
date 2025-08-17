# Use lightweight Nginx image
FROM nginx:alpine

# Remove default Nginx files
RUN rm -rf /usr/share/nginx/html/*

# Copy all static files (HTML, CSS, JS, images)
COPY . /usr/share/nginx/html

# Configure Nginx for Cloud Run (listens on $PORT)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# App Runner requires PORT environment variable
ENV PORT=8080
EXPOSE $PORT

# Start Nginx with dynamic PORT
CMD sed -i "s/listen 80/listen $PORT/g" /etc/nginx/conf.d/default.conf && \
    nginx -g 'daemon off;'
