# CVgator 🐊

> **Status:** Archived Prototype (Deprecated)  
> *A legacy full-stack exploration for peer-reviewed resume critiques and automated feedback pipelines. Decommissioned and preserved for UI/architectural reference.*

---

## Overview

CVgator was built as a prototype platform to test workflows around resume sharing, peer discussions, and automated PDF content extraction. 

The focus of this build was rapid end-to-end implementation—standing up static client views, multipart upload handlers, and backend critique pipelines in a compact codebase.

---

## Stack & Components

- **Client:** Semantic HTML5, CSS3, Vanilla JS
- **Server:** Node.js, Express.js (REST routes)
- **Database:** MongoDB / Mongoose (Legacy)
- **Pipelines:** Multipart buffer handling, PDF text extraction (`pdf-parse`)

---

## Viewing the Layouts

Backend services and database instances are offline. To inspect the frontend design and layouts locally:

```bash
git clone [https://github.com/](https://github.com/)<your-username>/cvgator.git
cd cvgator
