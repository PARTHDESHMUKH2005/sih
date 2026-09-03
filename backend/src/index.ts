import { app } from "./app.js";

const port = Number(process.env.BACKEND_PORT ?? 8000);

app.listen(port, () => {
  console.log(`Bhoomi Suraksha backend listening on http://localhost:${port}`);
  console.log(`API docs at http://localhost:${port}/api/docs`);
});
