FROM python:3.12-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    g++ \
    gcc \
    make \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Node for JS execution
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get update && \
    apt-get install -y --no-install-recommends nodejs && \
    rm -rf /var/lib/apt/lists/*

# Non-root user
RUN useradd -m -u 1000 runner

# 🔑 THIS IS THE FIX
RUN mkdir -p /code /tmp && \
    chown -R runner:runner /code /tmp && \
    chmod 1777 /tmp

WORKDIR /code      # ← MUST match mount target

USER runner
CMD ["sh"]
