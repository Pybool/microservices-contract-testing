import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

const PROVIDER_URL = process.env.PROVIDER_URL || "http://localhost:5000";

app.get("/users", async (_req, res) => {
  const response = await axios.get(`${PROVIDER_URL}/users`);
  res.json(response.data);
});

app.get("/users/:id", async (req, res) => {
  const response = await axios.get(`${PROVIDER_URL}/users/${req.params.id}`);
  res.json(response.data);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Consumer running on port ${PORT}`));

export default app;
