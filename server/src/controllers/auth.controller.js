import {
  getCurrentUser,
  loginUser,
  registerUser,
  updateUserAvatar,
  updateUserProfile
} from "../services/auth.service.js";

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

export async function updateProfile(req, res) {
  const user = await updateUserProfile(req.user.id, req.validated.body);
  res.json({ user });
}

export async function uploadProfileAvatar(req, res) {
  const user = await updateUserAvatar(req.user.id, req.file);
  res.json({ user });
}
