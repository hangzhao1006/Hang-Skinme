#  Document 1: Virtual Environment & GCP Setup Guide

This guide explains how each team member can set up their **GCP VM**, connect it to **Docker Hub** and **GitHub**, and verify everything for collaborative development.

---

## 1️⃣ Install Required Packages on GCP VM
Before running anything else, ensure the following packages are installed:

```bash
sudo apt-get update
sudo apt install git
sudo apt install docker.io
```

### ✅ Test Docker
Run the following to confirm Docker is working:
```bash
sudo docker run --rm -ti dlops/simple-translate
python cli.py
exit
```

If the container runs successfully, Docker is installed correctly.

---

## 2️⃣ Docker Setup on GCP

### 2.1 Check Docker Installation
```bash
sudo docker run --rm -ti dlops/simple-translate
```
If it runs without error, Docker is correctly configured.

---

### 2.2 Log In to Docker Hub
Use your own Docker Hub username and password (or token):
```bash
sudo docker login -u <your-dockerhub-username>
# Example:
sudo docker login -u rickyliu6771
```

#### 🔐 Access Token Reminder
To link Docker Hub securely:
- Go to **Docker Hub → Settings → Personal Access Tokens**
- Click **Generate New Token**
- Copy the token and paste it when your VM prompts for a password.

---

### 2.3 Tag and Push Your Own Docker Image
If you’ve built or pulled an image (e.g., `dlops/simple-translate`):
```bash
sudo docker tag dlops/simple-translate <your-dockerhub-username>/simple-translate-ac215
sudo docker push <your-dockerhub-username>/simple-translate-ac215
```

Example:
```bash
sudo docker tag dlops/simple-translate rickyliu6771/simple-translate-ac215
sudo docker push rickyliu6771/simple-translate-ac215
```

---

### 2.4 (Optional) Add Yourself to Docker Group
Avoid typing `sudo` every time:
```bash
sudo usermod -aG docker $USER
exit  # log out and SSH back in
```

---

### 2.5 Pull and Verify Image
```bash
docker pull <your-dockerhub-username>/simple-translate-ac215:latest
docker image ls
```

---

## 3️⃣ Git & GitHub Setup on GCP

### 3.1 Configure Git Identity
```bash
git config --global user.name "Your Name"
git config --global user.email "your_email@domain.com"
```

Example:
```bash
git config --global user.name "Jingrui Liu"
git config --global user.email "jingrui_liu@g.harvard.edu"
```

---

### 3.2 Clone the AC215 Course Template
```bash
git clone -b milestone2 https://github.com/ac2152024/ac2152024_template.git
```

---

## 4️⃣ Connect VM to GitHub via SSH

### 4.1 Generate SSH Key
```bash
ssh-keygen -t ed25519 -C "your_github_email@example.com"
```
Press **Enter** through all prompts (no passphrase needed).

### 4.2 Display Your Public Key
```bash
cat ~/.ssh/id_ed25519.pub
```

### 4.3 Add Key to GitHub
Copy the entire output line, then:
- Go to [GitHub → Settings → SSH and GPG keys](https://github.com/settings/keys)
- Click **New SSH Key**
- Title: `GCP VM`
- Paste → **Save**

### 4.4 Test Connection
```bash
ssh -T git@github.com
```
You should see:
> “Hi <your-username>! You've successfully authenticated, but GitHub does not provide shell access.”

---

## 5️⃣ Clone the Team Repository
After authentication succeeds:
```bash
git clone git@github.com:jingruiliu-ops/skincare_project.git
cd skincare_project
```

---

## 6️⃣ Make and Push Changes
```bash
git add .
git commit -m "update from <your-name>"
git push origin main
```

Once added as a collaborator, your commits will appear under your GitHub username.

---

## ✅ At This Point You Can
- Push/pull Docker images between your GCP VM and your own Docker Hub
- Push/pull project code between your VM and the shared GitHub repo (`jingruiliu-ops/skincare_project`)

---

## Optional Checks

### Verify Everything Works
```bash
git config --list       # Check Git identity
docker image ls         # Check Docker images
ssh -T git@github.com   # Test GitHub SSH
```

### Sync Latest Updates from Teammates
When new changes are pushed by others:
```bash
git pull origin main
```

If merge conflicts occur:
```bash
git status
git merge --abort      # cancel merge
git stash              # temporarily save local edits
git pull origin main   # update repo
git stash pop          # reapply local edits
```
