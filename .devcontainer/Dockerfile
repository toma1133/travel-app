FROM node:lts-slim

# 設定工作目錄
WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y \
    git \
    curl \
    gnupg \
    build-essential \
    && rm -rf /var/lib/apt/lists/*
    
ENV BASH_ENV $HOME/.bashrc

# 暴露應用程式埠
EXPOSE 5173

# 保持容器運作，直到 VS Code 連接並啟動服務
CMD ["sleep", "infinity"]