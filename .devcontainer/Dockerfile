FROM mcr.microsoft.com/devcontainers/base:debian
USER vscode

# Install deno
RUN curl -fsSL https://deno.land/install.sh | bash -s -- -y \
    && sudo ln -sf $HOME/.deno/bin/deno /usr/local/bin/deno \
    && deno -v

# Install node
RUN curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash \
    && export NVM_DIR="$HOME/.nvm" \
    && . "$NVM_DIR/nvm.sh" \
    && nvm install node \
    && nvm use node \
    && sudo ln -sf "$NVM_DIR/versions/node/$(nvm version)/bin/node" /usr/local/bin/node \
    && sudo ln -sf "$NVM_DIR/versions/node/$(nvm version)/bin/npm" /usr/local/bin/npm \
    && node -v \
    && npm -v

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash \
    && sudo ln -sf $HOME/.bun/bin/bun /usr/local/bin/bun \
    && bun -v

# Install google chrome
RUN sudo apt-get update \
    && sudo apt-get install -y gnupg \
    && curl -fsSL https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo gpg --dearmor -o /usr/share/keyrings/google-chrome.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] https://dl-ssl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list \
    && sudo apt-get update \
    && sudo apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 --no-install-recommends \
    && google-chrome --version
