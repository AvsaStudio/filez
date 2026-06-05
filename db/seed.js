import db from "#db/client";

await db.connect();
await seed();
await db.end();
console.log("🌱 Database seeded.");

async function seed() {
  // TODO
  const folders = ["Documents", "Pictures", "Music"];

  for (const folderName of folders) {
    const {
      rows: [folder],
    } = await db.query("INSERT INTO folders (name) VALUES ($1) RETURNING *", [
      folderName,
    ]);

    for (let i = 1; i <= 5; i++) {
      await db.query(
        "INSERT INTO files (name, size, folder_id) VALUES ($1, $2, $3)",
        [`${folderName.toLowerCase()}-${i}.txt`, i * 100, folder.id]
      );
    }
  }
}
