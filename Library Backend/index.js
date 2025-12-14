const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("./config/db"); // uses Render PostgreSQL

const server = express();
const PORT = process.env.PORT || 3003;

server.use(express.json());
server.use(express.urlencoded({ extended: true }));

// Simple CORS
server.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );

  res.header("Access-Control-Allow-Headers", "Content-Type, x-user-role");

  next();
});


function requireStudent(req, res, next) {
  const role = (req.headers["x-user-role"] || "").toLowerCase();
  if (role !== "student") {
    return res
      .status(403)
      .json({ message: "Only students can borrow/return books." });
  }
  next();
}

function requireLibrarian(req, res, next) {
  const role = (req.headers["x-user-role"] || "").toLowerCase();
  if (role !== "librarian") {
    return res.status(403).json({ message: "Access denied. Librarian only." });
  }
  next();
}

// ROOT 
server.get("/", (req, res) => {
  res.send("Welcome to the Digital Library Catalogue System API");
});

//AUTHENTICATION

// POST /api/auth/register
server.post("/api/auth/register", async (req, res) => {
  const { username, email, password, contact, role } = req.body;

  try {
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Username, email and password are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userRole =
      role === "librarian" ? "librarian" : "student";

    await pool.query(
      `INSERT INTO users (username, email, password, contact, role)
       VALUES ($1, $2, $3, $4, $5)`,
      [username, email, hashedPassword, contact || null, userRole]
    );

    return res
      .status(201)
      .json({ message: "User account created successfully" });
  } catch (error) {
    console.log(error);

    if (error.code === "23505") {
      return res
        .status(409)
        .json({ message: "Email or username already exists" });
    }

    return res
      .status(500)
      .json({ message: "Registration failed" });
  }
});

// POST /api/auth/login
server.post("/api/auth/login", async (req, res) => {
  const { emailOrUsername, password } = req.body;

  try {
    if (!emailOrUsername || !password) {
      return res
        .status(400)
        .json({ message: "Email/Username and password are required" });
    }

    const result = await pool.query(
      `SELECT * FROM users WHERE email = $1 OR username = $1`,
      [emailOrUsername]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const { password: _, ...safeUser } = user;

    return res.status(200).json({
      message: "Login successful",
      user: safeUser,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Login failed" });
  }
});

// BOOKS 

// GET /api/books
server.get("/api/books", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM books ORDER BY created_at DESC"
    );
    console.log("BOOKS FROM DB:", result.rows);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Failed to retrieve books" });
  }
});

// POST /api/books
server.post("/api/books", async (req, res) => {
  const {
    title,
    author,
    isbn,
    category,
    year_published,
    total_copies,
  } = req.body;

  try {
    if (!title || !author) {
      return res
        .status(400)
        .json({ message: "Title and author are required" });
    }

    const total = total_copies ? parseInt(total_copies, 10) : 1;

    const result = await pool.query(
      `INSERT INTO books
       (title, author, isbn, category, year_published, total_copies, available_copies)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        title,
        author,
        isbn || null,
        category || null,
        year_published || null,
        total,
        total,
      ]
    );

    return res.status(201).json({
      message: "Book added to catalogue successfully",
      book: result.rows[0],
    });
  } catch (error) {
    console.log(error);

    if (error.code === "23505") {
      return res
        .status(409)
        .json({ message: "A book with this ISBN already exists" });
    }

    return res
      .status(500)
      .json({ message: "Failed to add book" });
  }
});

// PUT /api/books/:id  -> update a book
server.put("/api/books/:id", async (req, res) => {
  const { id } = req.params;
  const {
    title,
    author,
    isbn,
    category,
    year_published,
    total_copies,
    available_copies,
  } = req.body;

  try {
    if (!title || !author) {
      return res
        .status(400)
        .json({ message: "Title and author are required" });
    }

    const total = total_copies ? parseInt(total_copies, 10) : 1;
    const available =
      available_copies != null
        ? parseInt(available_copies, 10)
        : total; // default available = total

    await pool.query(
      `UPDATE books
       SET title = $1,
           author = $2,
           isbn = $3,
           category = $4,
           year_published = $5,
           total_copies = $6,
           available_copies = $7
       WHERE id = $8`,
      [
        title,
        author,
        isbn || null,
        category || null,
        year_published || null,
        total,
        available,
        id,
      ]
    );

    return res.status(200).json({ message: "Book updated successfully" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Book update failed" });
  }
});

// DELETE /api/books/:id  -> delete a book
server.delete("/api/books/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM books WHERE id = $1", [id]);
    return res.status(200).json({ message: "Book deleted successfully" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Book deletion failed" });
  }
});

// SEARCH /api/books/search?q=keyword
server.get("/api/books/search", async (req, res) => {
  const { q } = req.query;
  const search = q ? `%${q}%` : "%";

  try {
    const result = await pool.query(
      `SELECT * FROM books
       WHERE title ILIKE $1
          OR author ILIKE $1
          OR category ILIKE $1
          OR isbn ILIKE $1
       ORDER BY created_at DESC`,
      [search]
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Search failed" });
  }
});

// BORROWING ROUTES

// POST /api/borrow  (student borrows a book)
server.post("/api/borrow", requireStudent, async (req, res) => {
  const { user_id, book_id } = req.body;

  if (!user_id || !book_id) {
    return res.status(400).json({ message: "user_id and book_id are required." });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1) Ensure book exists and available (lock)
    const bookResult = await client.query(
      "SELECT id, available_copies FROM books WHERE id = $1 FOR UPDATE",
      [book_id]
    );

    if (bookResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Book not found." });
    }

    const available = bookResult.rows[0].available_copies;

    if (available <= 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Book is currently not available." });
    }

    // 2) Prevent borrowing same book twice without returning
    const existingBorrow = await client.query(
      `SELECT id FROM borrow_records
       WHERE user_id = $1 AND book_id = $2 AND status = 'borrowed'`,
      [user_id, book_id]
    );

    if (existingBorrow.rowCount > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "You already borrowed this book. Return it first." });
    }

    // 3) Create borrow record (due date = 14 days)
    const borrowInsert = await client.query(
      `INSERT INTO borrow_records (user_id, book_id, due_date, status)
       VALUES ($1, $2, NOW() + INTERVAL '14 days', 'borrowed')
       RETURNING id, borrow_date, due_date, status`,
      [user_id, book_id]
    );

    // 4) Decrease available copies
    await client.query(
      "UPDATE books SET available_copies = available_copies - 1 WHERE id = $1",
      [book_id]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Book borrowed successfully.",
      borrow: borrowInsert.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.log(error);
    return res.status(500).json({ message: "Error borrowing book." });
  } finally {
    client.release();
  }
});

// POST /api/return  (student returns a borrowed book)
server.post("/api/return", requireStudent, async (req, res) => {
  const { borrow_id, user_id } = req.body;

  if (!borrow_id || !user_id) {
    return res.status(400).json({ message: "borrow_id and user_id are required." });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1) Find the borrow record for that user (lock)
    const borrowResult = await client.query(
      `SELECT id, book_id, status
       FROM borrow_records
       WHERE id = $1 AND user_id = $2
       FOR UPDATE`,
      [borrow_id, user_id]
    );

    if (borrowResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Borrow record not found for this user." });
    }

    const record = borrowResult.rows[0];

    if (record.status !== "borrowed") {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "This book is already returned." });
    }

    // 2) Mark returned
    await client.query(
      `UPDATE borrow_records
       SET status = 'returned', return_date = NOW()
       WHERE id = $1`,
      [borrow_id]
    );

    // 3) Increase available copies
    await client.query(
      "UPDATE books SET available_copies = available_copies + 1 WHERE id = $1",
      [record.book_id]
    );

    await client.query("COMMIT");

    return res.status(200).json({ message: "Book returned successfully." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.log(error);
    return res.status(500).json({ message: "Error returning book." });
  } finally {
    client.release();
  }
});

// GET /api/borrow/my/:userId (student sees own borrow records)
server.get("/api/borrow/my/:userId", requireStudent, async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `SELECT br.id,
              br.book_id,
              b.title,
              b.author,
              br.borrow_date,
              br.due_date,
              br.return_date,
              br.status
       FROM borrow_records br
       JOIN books b ON b.id = br.book_id
       WHERE br.user_id = $1
       ORDER BY br.borrow_date DESC`,
      [userId]
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error loading your borrow history." });
  }
});

// GET /api/borrow (librarian sees all borrow records)
server.get("/api/borrow", requireLibrarian, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT br.id,
              br.user_id,
              u.username,
              u.email,
              br.book_id,
              b.title,
              b.author,
              br.borrow_date,
              br.due_date,
              br.return_date,
              br.status
       FROM borrow_records br
       JOIN users u ON u.id = br.user_id
       JOIN books b ON b.id = br.book_id
       ORDER BY br.borrow_date DESC`
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error loading borrow records." });
  }
});

server.listen(PORT, () => {
  console.log(`Digital Library API is running on port ${PORT}`);
});
