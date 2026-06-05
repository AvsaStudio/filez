import express from "express";
import db from "#db/client";

const app = express();

app.use(express.json());

app.get("/files", async (req, res) => {
  const sql = `
    SELECT
      files.*,
      folders.name AS folder_name
    FROM files
    JOIN folders ON files.folder_id = folders.id
  `;

  const { rows } = await db.query(sql);
  res.send(rows);
});

app.get("/folders", async (req, res) => {
  const { rows } = await db.query("SELECT * FROM folders");
  res.send(rows);
});

app.get("/folders/:id", async (req, res) => {
  const sql = `
    SELECT
      folders.*,
      COALESCE(json_agg(files.*) FILTER (WHERE files.id IS NOT NULL), '[]') AS files
    FROM folders
    LEFT JOIN files ON files.folder_id = folders.id
    WHERE folders.id = $1
    GROUP BY folders.id
  `;

  const { rows } = await db.query(sql, [req.params.id]);

  if (rows.length === 0) {
    return res.status(404).send({ error: "Folder not found" });
  }

  res.send(rows[0]);
});

app.post("/folders/:id/files", async (req, res) => {
  const folderId = req.params.id;

  const { rows: folders } = await db.query(
    "SELECT * FROM folders WHERE id = $1",
    [folderId]
  );

  if (folders.length === 0) {
    return res.status(404).send({ error: "Folder not found" });
  }

  if (!req.body || !req.body.name || !req.body.size) {
    return res.status(400).send({ error: "Name and size are required" });
  }

  const { name, size } = req.body;

  const { rows } = await db.query(
    `
    INSERT INTO files (name, size, folder_id)
    VALUES ($1, $2, $3)
    RETURNING *
    `,
    [name, size, folderId]
  );

  res.status(201).send(rows[0]);
});

export default app;
