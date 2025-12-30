FROM python:3.12-alpine

# Install Node.js and C++ compiler (g++)
RUN apk add --no-cache nodejs g++ make musl-dev

# Create a non-root user
RUN adduser -D -h /home/runner -u 1000 runner

# Set working directory
WORKDIR /home/runner

# Switch to non-root user
USER runner

# Entrypoint is not fixed anymore as we might run different commands
# We'll handle the command in server.js, but we can default to sh or python
CMD ["sh"]