'use client'
import { io } from "socket.io-client";

let socket;
const ENDPOINT = "https://studysphere-backend-nygl.onrender.com";
// const ENDPOINT = "http://localhost:4000/api";

socket = io(ENDPOINT);

export default socket;
