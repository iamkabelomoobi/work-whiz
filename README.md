<div align="center">
<pre>
╔═════════════════════════════════════════════════════════════════════╗
║                                                                     ║
║  ██   ██  ████  ██████ ██  ██        ██   ██ ██  ██ ██████ ██████   ║
║  ██   ██ ██  ██ ██  ██ ██ ██         ██   ██ ██  ██   ██      ██    ║
║  ██ █ ██ ██  ██ ██████ ████   ██████ ██ █ ██ ██████   ██     ██     ║
║  ███ ███ ██  ██ ██ ██  ██ ██         ███ ███ ██  ██   ██    ██      ║
║  ██   ██  ████  ██  ██ ██  ██        ██   ██ ██  ██ ██████ ██████   ║
║                                                                     ║
║                                                                     ║
╚═════════════════════════════════════════════════════════════════════╝
</pre>
</div>
<p align="center">
<img src="https://img.shields.io/github/actions/workflow/status/iamkabelomoobi/work-whiz/ci.yml?branch=main&label=CI&logo=githubactions&logoColor=white&color=0080ff" alt="CI Status">
<img src="https://img.shields.io/github/actions/workflow/status/iamkabelomoobi/work-whiz/codeql.yml?branch=main&label=CodeQL&logo=github&logoColor=white&color=yellow"**** alt="CodeQL Status">
 <img src="https://img.shields.io/github/license/iamkabelomoobi/work-whiz?style=default&logo=opensourceinitiative&logoColor=white&color=0080ff" alt="license">
 <img src="https://img.shields.io/github/last-commit/iamkabelomoobi/work-whiz?style=default&logo=git&logoColor=white&color=0080ff" alt="last-commit">

</p>
<p align="center"><!-- default option, no dependency badges. -->
</p>
<p align="center">
 <!-- default option, no dependency badges. -->
</p>
<br>

## 🔗 Table of Contents

- [🔗 Table of Contents](#-table-of-contents)
- [📍 Overview](#-overview)
- [🚀 Getting Started](#-getting-started)
  - [☑️ Prerequisites](#️-prerequisites)
  - [⚙️ Installation](#️-installation)
  - [🤖 Usage](#-usage)
  - [🔐 Auth API](#-auth-api)
- [📌 Project Roadmap](#-project-roadmap)
- [🔰 Contributing](#-contributing)
- [🎗 License](#-license)
- [🙌 Acknowledgments](#-acknowledgments)

---

## 📍 Overview

<code>❯ A is a modern job board platform designed to streamline the hiring process for recruiters and job seekers. It provides an intuitive interface for posting and discovering jobs, managing applications, and building professional profiles — all powered by a secure, role-based authentication system.
</code>

## 🚀 Getting Started

### ☑️ Prerequisites

> Before getting started with work-whiz, ensure your runtime environment meets the following requirements:

- **Programming Language:** Error detecting primary_language: {'json': 11, 'ts': 8, 'js': 1, 'yml': 2}
- **Package Manager:** Npm
- **Container Runtime:** Docker

### ⚙️ Installation

Install work-whiz using one of the following methods:

**Build from source:**

1. Clone the work-whiz repository:

```sh
❯ git clone https://github.com/iamkabelomoobi/work-whiz
```

2. Navigate to the project directory:

```sh
❯ cd work-whiz
```

3. Install the project dependencies:

**Using `npm`** &nbsp; [<img align="center" src="" />]()

```sh
❯ echo 'INSERT-INSTALL-COMMAND-HERE'
```

**Using `docker`** &nbsp; [<img align="center" src="https://img.shields.io/badge/Docker-2CA5E0.svg?style={badge_style}&logo=docker&logoColor=white" />](https://www.docker.com/)

```sh
❯ docker build -t iamkabelomoobi/work-whiz .
```

### 🤖 Usage

Run work-whiz using the following command:
**Using `npm`** &nbsp; [<img align="center" src="" />]()

```sh
❯ echo 'INSERT-RUN-COMMAND-HERE'
```

**Using `docker`** &nbsp; [<img align="center" src="https://img.shields.io/badge/Docker-2CA5E0.svg?style={badge_style}&logo=docker&logoColor=white" />](https://www.docker.com/)

```sh
❯ docker build -t work-whiz . && docker run -p 8080:8080 --env-file .env work-whiz
```

````

### 🧪 Testing

Run the test suite using the following command:
**Using `npm`** &nbsp; [<img align="center" src="" />]()

```sh
❯ npm run test
````

### 🔐 Auth API

Auth routes are handled by Better Auth and mounted under `/api/auth`.

#### Main endpoints

| Method | Endpoint |
| --- | --- |
| `POST` | `/api/auth/sign-up/email` |
| `POST` | `/api/auth/sign-in/email` |
| `POST` | `/api/auth/sign-out` |
| `GET`, `POST` | `/api/auth/get-session` |
| `GET` | `/api/auth/verify-email?token=...` |
| `POST` | `/api/auth/send-verification-email` |
| `POST` | `/api/auth/request-password-reset` |
| `POST` | `/api/auth/reset-password` |
| `GET` | `/api/auth/reset-password/:token` |
| `POST` | `/api/auth/change-password` |
| `POST` | `/api/auth/verify-password` |

#### Sign-up request bodies

Candidate:

```json
{
  "name": "Candidate User",
  "email": "candidate@example.com",
  "password": "StrongPass123!",
  "phone": "+270000000001",
  "role": "candidate",
  "title": "Mr"
}
```

Employer:

```json
{
  "name": "Orbit Talent",
  "email": "employer@example.com",
  "password": "StrongPass123!",
  "phone": "+270000000002",
  "role": "employer",
  "industry": "Technology",
  "websiteUrl": "https://example.com",
  "location": "Remote",
  "description": "Hiring platform team",
  "size": 25,
  "foundedIn": 2020
}
```

Admin:

```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "StrongPass123!",
  "phone": "+270000000003",
  "role": "admin"
}
```

#### Common request bodies

Sign in:

```json
{
  "email": "candidate@example.com",
  "password": "StrongPass123!"
}
```

Request password reset:

```json
{
  "email": "candidate@example.com",
  "redirectTo": "http://localhost:4200/reset-password"
}
```

Reset password:

```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewStrongPass123!"
}
```

#### Session and account endpoints

| Method | Endpoint |
| --- | --- |
| `GET` | `/api/auth/list-sessions` |
| `POST` | `/api/auth/revoke-session` |
| `POST` | `/api/auth/revoke-sessions` |
| `POST` | `/api/auth/revoke-other-sessions` |
| `POST` | `/api/auth/update-session` |
| `POST` | `/api/auth/update-user` |
| `POST` | `/api/auth/delete-user` |
| `GET` | `/api/auth/delete-user/callback` |
| `GET` | `/api/auth/list-accounts` |
| `POST` | `/api/auth/unlink-account` |
| `GET` | `/api/auth/account-info` |

#### OAuth and social endpoints

| Method | Endpoint |
| --- | --- |
| `POST` | `/api/auth/sign-in/social` |
| `GET`, `POST` | `/api/auth/callback/:id` |
| `POST` | `/api/auth/link-social` |
| `POST` | `/api/auth/refresh-token` |
| `POST` | `/api/auth/get-access-token` |

The current app configuration enables email/password auth and email verification. Social provider endpoints are exposed by Better Auth, but no social providers are configured yet.

---

## 📌 Project Roadmap

- [x] **`Task 1`**: <strike>User Authentication</strike>
- [x] **`Task 2`**: <strike>Admin Profile Management.</strike>
- [x] **`Task 3`**: <strike>Candidate Profile Management.</strike>
- [x] **`Task 4`**: <strike>Employer Profile Management.</strike>
- [x] **`Task 4`**: <strike>Job Listing Management.</strike>

---

## 🔰 Contributing

- **💬 [Join the Discussions](https://github.com/iamkabelomoobi/work-whiz/discussions)**: Share your insights, provide feedback, or ask questions.
- **🐛 [Report Issues](https://github.com/iamkabelomoobi/work-whiz/issues)**: Submit bugs found or log feature requests for the `work-whiz` project.
- **💡 [Submit Pull Requests](https://github.com/iamkabelomoobi/work-whiz/blob/main/CONTRIBUTING.md)**: Review open PRs, and submit your own PRs.

<details closed>
<summary>Contributing Guidelines</summary>

1. **Fork the Repository**: Start by forking the project repository to your github account.
2. **Clone Locally**: Clone the forked repository to your local machine using a git client.

   ```sh
   git clone https://github.com/iamkabelomoobi/work-whiz
   ```

3. **Create a New Branch**: Always work on a new branch, giving it a descriptive name.

   ```sh
   git checkout -b new-feature-x
   ```

4. **Make Your Changes**: Develop and test your changes locally.
5. **Commit Your Changes**: Commit with a clear message describing your updates.

   ```sh
   git commit -m 'Implemented new feature x.'
   ```

6. **Push to github**: Push the changes to your forked repository.

   ```sh
   git push origin new-feature-x
   ```

7. **Submit a Pull Request**: Create a PR against the original project repository. Clearly describe the changes and their motivations.
8. **Review**: Once your PR is reviewed and approved, it will be merged into the main branch. Congratulations on your contribution!

</details>

<details closed>
<summary>Contributor Graph</summary>
<br>
<p align="left">
   <a href="https://github.com{/iamkabelomoobi/work-whiz/}graphs/contributors">
      <img src="https://contrib.rocks/image?repo=iamkabelomoobi/work-whiz">
   </a>
</p>
</details>

---

## 🎗 License

This project is protected under the [SELECT-A-LICENSE](https://choosealicense.com/licenses) License. For more details, refer to the [LICENSE](https://choosealicense.com/licenses/) file.

---

## 🙌 Acknowledgments

- List any resources, contributors, inspiration, etc. here.
