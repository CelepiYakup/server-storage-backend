import express from "express";
import { UserController } from "../controllers/userController";
import redisClient from "../config/redisClient";

const router = express.Router();


router.post('/register', UserController.registerUser);


router.post('/login', UserController.loginUser);


router.post('/logout', UserController.logoutUser);


export default router;