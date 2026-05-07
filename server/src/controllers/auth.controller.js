import { getCurrentUser, loginUser, registerUser } from "../services/auth.service.js";

export async function register(req, res) {
  const auth = await registerUser(req.validated.body);
  res.status(201).json(auth);
}

export async function login(req, res) {
  const auth = await loginUser(req.validated.body);
  res.json(auth);
}

export async function me(req, res) {
  res.json({
    user: getCurrentUser(req.user)
  });
}
