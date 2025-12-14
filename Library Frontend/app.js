// Change this when you deploy backend to Render
const API_BASE = "http://localhost:3003";

// Elements
const authSection = document.getElementById("auth-section");
const librarySection = document.getElementById("library-section");
const navLinks = document.getElementById("nav-links");
const welcomeUserSpan = document.getElementById("welcome-user");
const logoutBtn = document.getElementById("logout-btn");

// Auth forms
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const showRegisterLink = document.getElementById("show-register-link");
const showLoginLink = document.getElementById("show-login-link");


// Login fields
const loginIdentityInput = document.getElementById("login-identity");
const loginPasswordInput = document.getElementById("login-password");
const loginError = document.getElementById("login-error");

// Register fields
const regUsernameInput = document.getElementById("reg-username");
const regEmailInput = document.getElementById("reg-email");
const regPasswordInput = document.getElementById("reg-password");
const regContactInput = document.getElementById("reg-contact");
const regRoleInput = document.getElementById("reg-role");

const registerError = document.getElementById("register-error");
const registerSuccess = document.getElementById("register-success");


// Books
const booksTableBody = document.getElementById("books-table-body");
const booksEmptyText = document.getElementById("books-empty");
const searchInput = document.getElementById("search-input");
const addBookForm = document.getElementById("add-book-form");
const addBookError = document.getElementById("add-book-error");
const addBookSuccess = document.getElementById("add-book-success");

// Borrowing UI
const tabCatalogueBtn = document.getElementById("tab-catalogue");
const tabMyBorrowsBtn = document.getElementById("tab-my-borrows");
const myBorrowsSection = document.getElementById("my-borrows-section");
const borrowsTableBody = document.getElementById("borrows-table-body");
const borrowsEmptyText = document.getElementById("borrows-empty");
const refreshBorrowsBtn = document.getElementById("refresh-borrows-btn");

// Add book inputs
const bookTitleInput = document.getElementById("book-title");
const bookAuthorInput = document.getElementById("book-author");
const bookIsbnInput = document.getElementById("book-isbn");
const bookCategoryInput = document.getElementById("book-category");
const bookYearInput = document.getElementById("book-year");
const bookTotalInput = document.getElementById("book-total");

// Edit mode
const bookFormTitle = document.getElementById("book-form-title");
const cancelEditBtn = document.getElementById("cancel-edit-btn");
let currentBooks = [];
let currentEditId = null;

// ---- Simple auth state using localStorage ----

function getCurrentUser() {
  const json = localStorage.getItem("libraryUser");
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function authHeaders() {
  const user = getCurrentUser();
  return {
    "Content-Type": "application/json",
    "x-user-role": user?.role || "student",
  };
}

function setCurrentUser(user) {
  localStorage.setItem("libraryUser", JSON.stringify(user));
}

function clearCurrentUser() {
  localStorage.removeItem("libraryUser");
}


function showAuth() {
  authSection.classList.remove("hidden");
  librarySection.classList.add("hidden");
  navLinks.classList.add("hidden");
  showLoginForm(); // always start from login screen
}

function showLibrary(user) {
  authSection.classList.add("hidden");
  librarySection.classList.remove("hidden");
  navLinks.classList.remove("hidden");
  welcomeUserSpan.textContent = `Hi, ${user.username || user.email} (${user.role})`;

  // Hide add-book card for students (read-only)
  const addBookCard = addBookForm.closest(".card");
  if (user.role !== "librarian") {
    addBookCard.classList.add("hidden");
  } else {
    addBookCard.classList.remove("hidden");
  }

  resetBookForm();
  loadBooks();

  // default view to catalogue tab after login
  showCatalogueTab();
}

async function loadMyBorrows() {
  const user = getCurrentUser();
  if (!user?.id) {
    borrowsEmptyText.textContent = "Please login again.";
    return;
  }

  borrowsTableBody.innerHTML = "";
  borrowsEmptyText.textContent = "Loading...";

  try {
    const res = await fetch(`${API_BASE}/api/borrow/my/${user.id}`, {
      headers: {
        "x-user-role": user.role || "student",
      },
    });

    const data = await res.json();

    if (!res.ok) {
      borrowsEmptyText.textContent = data.message || "Failed to load borrow records.";
      return;
    }

    if (!Array.isArray(data) || data.length === 0) {
      borrowsEmptyText.textContent = "You have no borrowed books yet.";
      return;
    }

    borrowsEmptyText.textContent = "";
    renderBorrowTable(data);
  } catch (err) {
    console.error(err);
    borrowsEmptyText.textContent = "Network error loading borrow records.";
  }
}

function renderBorrowTable(records) {
  borrowsTableBody.innerHTML = "";

  records.forEach((r) => {
    const borrowDate = r.borrow_date ? new Date(r.borrow_date) : null;
    const dueDate = r.due_date ? new Date(r.due_date) : null;

    const daysBorrowed =
      borrowDate ? Math.floor((Date.now() - borrowDate.getTime()) / (1000 * 60 * 60 * 24)) : "";

    const isOverdue = dueDate && r.status === "borrowed" && Date.now() > dueDate.getTime();

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.title || ""}</td>
      <td>${borrowDate ? borrowDate.toLocaleDateString() : ""}</td>
      <td>${dueDate ? dueDate.toLocaleDateString() : ""}</td>
      <td>${daysBorrowed}</td>
      <td>${isOverdue ? "Overdue" : (r.status || "")}</td>
      <td>
        ${
          r.status === "borrowed"
            ? `<button class="btn primary btn-sm return-btn" data-borrow-id="${r.id}">Return</button>`
            : `<span class="muted-text">—</span>`
        }
      </td>
    `;

    borrowsTableBody.appendChild(tr);
  });
}

function showLoginForm() {
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");
  loginError.textContent = "";
}

function showRegisterForm() {
  registerForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
  registerError.textContent = "";
  registerSuccess.textContent = "";
}

function showCatalogueTab() {
  const layout = document.querySelector("#library-section .layout");
  if (layout) layout.classList.remove("hidden");
  if (myBorrowsSection) myBorrowsSection.classList.add("hidden");
}

function showMyBorrowsTab() {
  const layout = document.querySelector("#library-section .layout");
  if (layout) layout.classList.add("hidden");
  if (myBorrowsSection) myBorrowsSection.classList.remove("hidden");
  loadMyBorrows();
}



// ---- Tabs events ----
if (tabCatalogueBtn) {
  tabCatalogueBtn.addEventListener("click", () => showCatalogueTab());
}
if (tabMyBorrowsBtn) {
  tabMyBorrowsBtn.addEventListener("click", () => showMyBorrowsTab());
}
if (refreshBorrowsBtn) {
  refreshBorrowsBtn.addEventListener("click", () => loadMyBorrows());
}


if (borrowsTableBody) {
  borrowsTableBody.addEventListener("click", (e) => {
    const returnBtn = e.target.closest(".return-btn");
    if (!returnBtn) return;

    const borrowId = Number(returnBtn.dataset.borrowId);
    returnBook(borrowId);
  });
}


showRegisterLink.addEventListener("click", (e) => {
  e.preventDefault();
  showRegisterForm();
});

showLoginLink.addEventListener("click", (e) => {
  e.preventDefault();
  showLoginForm();
});


// ---- Register ----

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  registerError.textContent = "";
  registerSuccess.textContent = "";

  const payload = {
    username: regUsernameInput.value.trim(),
    email: regEmailInput.value.trim(),
    password: regPasswordInput.value,
    contact: regContactInput.value.trim(),
    role: regRoleInput.value
  };

  if (!payload.username || !payload.email || !payload.password) {
    registerError.textContent = "Please fill in all required fields.";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      registerError.textContent = data.message || "Registration failed.";
      return;
    }

    registerSuccess.textContent = "Account created. You can now login.";
    registerForm.reset();
  } catch (err) {
    console.error(err);
    registerError.textContent = "Network error. Please try again.";
  }
});

// ---- Login ----

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.textContent = "";

  const payload = {
    emailOrUsername: loginIdentityInput.value.trim(),
    password: loginPasswordInput.value,
  };

  if (!payload.emailOrUsername || !payload.password) {
    loginError.textContent = "Please enter your credentials.";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      loginError.textContent = data.message || "Login failed.";
      return;
    }

    setCurrentUser(data.user);
    showLibrary(data.user);
  } catch (err) {
    console.error(err);
    loginError.textContent = "Network error. Please try again.";
  }
});

// ---- Logout ----

logoutBtn.addEventListener("click", () => {
  clearCurrentUser();
  showAuth();
});

// ---- Load books ----

async function loadBooks(query = "") {
  booksTableBody.innerHTML = "";
  booksEmptyText.textContent = "Loading...";

  let url = `${API_BASE}/api/books`;
  if (query && query.trim() !== "") {
    url = `${API_BASE}/api/books/search?q=${encodeURIComponent(query.trim())}`;
  }

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      booksEmptyText.textContent = "Failed to load books.";
      return;
    }

    if (!Array.isArray(data) || data.length === 0) {
      currentBooks = [];
      booksEmptyText.textContent = "No books found.";
      return;
    }

    currentBooks = data;
    booksEmptyText.textContent = "";
    renderBooksTable();
  } catch (err) {
    console.error(err);
    booksEmptyText.textContent = "Network error. Could not load books.";
  }
}

function renderBooksTable() {
  booksTableBody.innerHTML = "";

  const user = getCurrentUser();
  const isLibrarian = user?.role === "librarian";
  const isStudent = user?.role === "student";

  currentBooks.forEach((book) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${book.title || ""}</td>
      <td>${book.author || ""}</td>
      <td>${book.category || ""}</td>
      <td>${book.year_published || ""}</td>
      <td>${book.available_copies ?? ""}</td>
      <td>
        ${
          isLibrarian
            ? `<button class="btn secondary btn-sm edit-btn" data-id="${book.id}">Edit</button>
               <button class="btn primary btn-sm delete-btn" data-id="${book.id}">Delete</button>`
            : isStudent
              ? (book.available_copies > 0
                  ? `<button class="btn primary btn-sm borrow-btn" data-id="${book.id}">Borrow</button>`
                  : `<span class="muted-text">Unavailable</span>`)
              : `<span class="muted-text">Read-only</span>`
        }
      </td>
    `;

    booksTableBody.appendChild(tr);
  });
}


// ---- Add / Update book ----

addBookForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  addBookError.textContent = "";
  addBookSuccess.textContent = "";

  const payload = {
    title: bookTitleInput.value.trim(),
    author: bookAuthorInput.value.trim(),
    isbn: bookIsbnInput.value.trim(),
    category: bookCategoryInput.value.trim(),
    year_published: bookYearInput.value ? Number(bookYearInput.value) : null,
    total_copies: bookTotalInput.value ? Number(bookTotalInput.value) : 1,
    // available_copies will be handled in backend (defaults to total)
  };

  if (!payload.title || !payload.author) {
    addBookError.textContent = "Title and Author are required.";
    return;
  }

  try {
    let url = `${API_BASE}/api/books`;
    let method = "POST";

    if (currentEditId !== null) {
      // Update mode
      url = `${API_BASE}/api/books/${currentEditId}`;
      method = "PUT";
    }

    const res = await fetch(url, {
      method,
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      addBookError.textContent =
        data.message || "Could not save the book. Try again.";
      return;
    }

    if (currentEditId !== null) {
      addBookSuccess.textContent = "Book updated successfully.";
    } else {
      addBookSuccess.textContent = "Book added successfully.";
    }

    addBookForm.reset();
    bookTotalInput.value = 1;
    resetBookForm();
    loadBooks(searchInput.value);
  } catch (err) {
    console.error(err);
    addBookError.textContent = "Network error. Please try again.";
  }
});



function resetBookForm() {
  currentEditId = null;
  bookFormTitle.textContent = "Add New Book";
  cancelEditBtn.classList.add("hidden");
}

// ---- Edit & Delete handlers ----

booksTableBody.addEventListener("click", (e) => {
  const borrowBtn = e.target.closest(".borrow-btn");
  const editBtn = e.target.closest(".edit-btn");
  const deleteBtn = e.target.closest(".delete-btn");

  if (borrowBtn) {
    const id = Number(borrowBtn.dataset.id);
    borrowBook(id);
  } else if (editBtn) {
    const id = Number(editBtn.dataset.id);
    startEditBook(id);
  } else if (deleteBtn) {
    const id = Number(deleteBtn.dataset.id);
    deleteBook(id);
  }
});

//  borrow and return functions
async function borrowBook(bookId) {
  const user = getCurrentUser();
  if (!user?.id) return alert("Please login again.");

  try {
    const res = await fetch(`${API_BASE}/api/borrow`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ user_id: user.id, book_id: bookId }),
    });

    const data = await res.json();

    if (!res.ok) {
      return alert(data.message || "Could not borrow book.");
    }

    alert("Borrowed successfully!");
    loadBooks(searchInput.value);
  } catch (err) {
    console.error(err);
    alert("Network error borrowing book.");
  }
}

async function returnBook(borrowId) {
  const user = getCurrentUser();
  if (!user?.id) return alert("Please login again.");

  try {
    const res = await fetch(`${API_BASE}/api/return`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ borrow_id: borrowId, user_id: user.id }),
    });

    const data = await res.json();

    if (!res.ok) {
      return alert(data.message || "Could not return book.");
    }

    alert("Returned successfully!");
    loadMyBorrows();
    loadBooks(searchInput.value);
  } catch (err) {
    console.error(err);
    alert("Network error returning book.");
  }
}

// ---- Start editing a book ----

function startEditBook(id) {
  const book = currentBooks.find((b) => b.id === id);
  if (!book) return;

  currentEditId = id;
  bookFormTitle.textContent = "Edit Book";
  cancelEditBtn.classList.remove("hidden");

  bookTitleInput.value = book.title || "";
  bookAuthorInput.value = book.author || "";
  bookIsbnInput.value = book.isbn || "";
  bookCategoryInput.value = book.category || "";
  bookYearInput.value = book.year_published || "";
  bookTotalInput.value = book.total_copies || 1;

  // Scroll to form on mobile
  addBookForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ---- Cancel edit ----

cancelEditBtn.addEventListener("click", () => {
  addBookForm.reset();
  bookTotalInput.value = 1;
  resetBookForm();
});

// ---- Delete book ----

async function deleteBook(id) {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this book?"
  );
  if (!confirmDelete) return;

  try {
    const res = await fetch(`${API_BASE}/api/books/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Could not delete the book.");
      return;
    }

  
    currentBooks = currentBooks.filter((b) => b.id !== id);
    renderBooksTable();
  } catch (err) {
    console.error(err);
    alert("Network error. Could not delete the book.");
  }
}

// ---- Search ----

let searchTimeout = null;
searchInput.addEventListener("input", () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadBooks(searchInput.value);
  }, 400);
});

// ---- On page load ----

document.addEventListener("DOMContentLoaded", () => {
  const user = getCurrentUser();
  if (user) {
    showLibrary(user);
  } else {
    showAuth();
  }
});
