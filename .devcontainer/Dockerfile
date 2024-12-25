FROM mcr.microsoft.com/devcontainers/javascript-node:18

# Install additional OS packages
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
  && apt-get -y install --no-install-recommends \
  python3-setuptools \
  build-essential \
  && apt-get clean -y \
  && rm -rf /var/lib/apt/lists/*

# [Optional] Uncomment if you want to install more global node packages
# RUN su node -c "npm install -g <your-package-list-here>" 