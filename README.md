# Shaik Mahammad Shariff - Personal Portfolio

Welcome to the repository for my personal portfolio website. This is a premium dark themed, responsive, and recruiter-friendly portfolio showcasing my education, technical skills, projects, certifications, and achievements.

**Live URL:** [https://skmdshariff143-ai.github.io/](https://skmdshariff143-ai.github.io/)

---

## 🎨 Design Style & Features
- **Premium Dark Theme:** Utilizes a charcoal black, deep teal, and muted silver color palette.
- **Responsive Layout:** Works flawlessly across mobile, tablet, and desktop devices.
- **Smooth Animations:** Integrated scroll reveal animations and micro-interactions.
- **Clean Structure:** Built with semantic HTML, modern CSS (Flexbox/Grid), and Vanilla JavaScript.
- **Sections Included:** Hero, About, Skills, Education, Internship, Projects, Certificates, Achievements, NSS Activities, Coding Profiles, Languages, Contact, and Footer.

## 🛠️ Technologies Used
- HTML5 (Semantic Structure)
- CSS3 (Custom Properties, Grid, Flexbox, Media Queries)
- JavaScript (DOM Manipulation, Intersection Observer API)
- FontAwesome (Icons)
- Google Fonts (Inter, Outfit)

---

## 📝 How to Customize Content

You can easily update the content of your portfolio by editing the `index.html` file. Look for the `<!-- TODO: -->` comments.

### 1. Update the Avatar Image
In `index.html`, locate the `<div class="avatar-placeholder">` inside the `#hero` section. You can replace this `<div>` with an `<img>` tag pointing to your actual professional photo once you have it.

### 2. Add Links to Projects & Demos
In the `#projects` section, replace the `href="#"` attributes inside `<div class="project-links">` with your actual GitHub repository URLs and Live Demo links.

### 3. Add Certificate Links/Images
In the `#certificates` section, update the `<a href="#" class="cert-link">` elements. Point the `href` to a PDF or an image of your certificate hosted online (like Google Drive or directly in this repo).

### 4. Resume Download Link
In the `#hero` section, find the `Download Resume` button. Change `href="#"` to the path of your resume (e.g., `href="assets/Shaik_Mahammad_Shariff_Resume.pdf"`). Make sure to add the PDF to your repository.

---

## 🚀 GitHub Pages Deployment Instructions

To make your website live at `https://skmdshariff143-ai.github.io/`, follow these exact steps:

### 1. Folder Structure
Ensure your files are in the root directory like this:
```
skmdshariff143-ai.github.io/
├── index.html     <-- Site Entry File
├── style.css
├── script.js
└── README.md
```
*(Note: For a GitHub Pages user site, the repository must be named exactly `username.github.io` using your username format, and the entry file must be `index.html` in the repository root.)*

### 2. Push to GitHub
Open your terminal (or Command Prompt / Git Bash), navigate to the directory where these files are located, and run the following exact git commands:

```bash
git init
git add .
git commit -m "Initial portfolio website"
git branch -M main
git remote add origin https://github.com/skmdshariff143-ai/skmdshariff143-ai.github.io.git
git push -u origin main
```

### 3. Enable GitHub Pages Settings
1. Go to your repository on GitHub: `https://github.com/skmdshariff143-ai/skmdshariff143-ai.github.io`
2. Click on **Settings** (the gear icon).
3. On the left sidebar, click on **Pages**.
4. Under "Build and deployment" > "Source", choose **Deploy from a branch**.
5. Under "Branch", select the **main** branch and select the **/root** folder.
6. Click **Save**.

Your site will take a few minutes to build. Once complete, it will be available at your final live portfolio URL:
[https://skmdshariff143-ai.github.io/](https://skmdshariff143-ai.github.io/)

### 4. Updating the Site Later
Whenever you edit files (like adding a new certificate or project):
1. Make your changes in the local files.
2. Run these commands:
   ```bash
   git add .
   git commit -m "Updated portfolio content"
   git push origin main
   ```
3. GitHub Pages will automatically rebuild and update your live site within a few minutes.
