# 📚 Digital Library Catalogue System

## 📖 Project Overview

The **Digital Library Catalogue System** is a web-based application developed to manage books and borrowing activities in a library environment. The system allows users to register, log in, browse available books, borrow and return books, while librarians manage the book catalogue.

This project was developed as part of a **Web Technologies** practical assessment to demonstrate understanding of client–server architecture, RESTful APIs, authentication, database integration, and role-based access control.

---

## 🎯 Objectives

* Provide a digital catalogue of library books
* Allow students to borrow and return books
* Allow librarians to add, update, and delete books
* Track borrowed books, due dates, and return status
* Enforce role-based access (Student vs Librarian)

---

## 👥 User Roles

### 👤 Student

* Register and log in
* View and search available books
* Borrow available books
* View borrowed books and due dates
* Return borrowed books

### 👨‍🏫 Librarian

* Register and log in
* Add new books to the catalogue
* Edit existing book details
* Delete books
* View all borrowing records

---

## ⚙️ Features Implemented

* User registration and login
* Password hashing using bcrypt
* Role-based access control
* Book CRUD operations (Create, Read, Update, Delete)
* Borrowing and returning system
* Due date tracking (14-day borrowing period)
* Search functionality
* Responsive frontend interface
* RESTful backend API
* PostgreSQL database integration

---

## 🛠️ Technology Stack

### Frontend

* HTML5
* CSS3
* Vanilla JavaScript

### Backend

* Node.js
* Express.js
* PostgreSQL
* bcryptjs

### Tools & Platforms

* pgAdmin 4 (database management)
* Render (backend deployment)
* Thunder Client / Browser Fetch API (API testing)
* Git & GitHub (version control)

---

## 🗄️ Database Design

The system uses PostgreSQL with the following core tables:

* `users`
* `books`
* `borrow_records`

### Relationships

* One user can borrow multiple books
* One book can be borrowed multiple times at different periods
* Borrow records track borrow date, due date, return date, and status

---

## 🔗 API Endpoints (Summary)

### Authentication

* `POST /api/auth/register` – Register user
* `POST /api/auth/login` – Login user

### Books

* `GET /api/books` – View all books
* `POST /api/books` – Add book (Librarian only)
* `PUT /api/books/:id` – Update book (Librarian only)
* `DELETE /api/books/:id` – Delete book (Librarian only)
* `GET /api/books/search?q=` – Search books

### Borrowing

* `POST /api/borrow` – Borrow a book (Student only)
* `POST /api/return` – Return a book (Student only)
* `GET /api/borrow/my/:userId` – View student borrow history
* `GET /api/borrow` – View all borrow records (Librarian only)

---

## 🚀 How to Run the Project Locally

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/digital-library-catalogue.git
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Configure Database

* Create a PostgreSQL database
* Update database credentials in `config/db.js`

### 4️⃣ Start the Server

```bash
npm run dev
```

The server will run on:

```
http://localhost:3003
```

---

## 🧪 Testing

* API endpoints tested using Thunder Client
* Frontend interactions tested via browser
* Database queries verified using pgAdmin 4

---

## 📚 References

This project was implemented by referencing documentation and learning resources from multiple online sources:

* Node.js Documentation – [https://nodejs.org](https://nodejs.org)
* Express.js Documentation – [https://expressjs.com](https://expressjs.com)
* PostgreSQL Documentation – [https://www.postgresql.org/docs/](https://www.postgresql.org/docs/)
* MDN Web Docs (HTML, CSS, JavaScript) – [https://developer.mozilla.org](https://developer.mozilla.org)
* bcryptjs Documentation – [https://www.npmjs.com/package/bcryptjs](https://www.npmjs.com/package/bcryptjs)
* REST API design tutorials and articles from online developer resources

These resources were used strictly for learning and guidance.

---

## ✍🏽 Author

**Bayaka Braimah**
10022300069
Bsc. Computer Science
Academic City University College

---

## ✅ Declaration

This project was implemented by me as part of an academic assessment. External resources were referenced for learning purposes; however, the system design, implementation, testing, and integration were carried out independently.
