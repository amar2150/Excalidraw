require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db.js");
const boardRoutes = require("./routes/boardRoutes");
const Board = require("./models/boardModel");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173"
}));

app.use("/api/boards", boardRoutes);

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_ORIGIN || "http://localhost:5173"
    },
});

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
//if users come he cant draw without board 
    socket.on("join-board", async ({ boardId }) => {
        if (!boardId) return;

        socket.join(boardId);
        console.log(`${socket.id} joined board ${boardId}`);
        try {
            const board = await Board.findById(boardId);
            if (board) {
                socket.emit("board-init", {
                    //board info send with socket in queue make task live or fast called emit 
                    boardId: board._id,
                    title: board.title,
                    elements: board.elements || [],
                });
            } else {
                socket.emit("board-error", { message: "Board not found" });
            }
        } catch (err) {
            console.error("Error loading board on join:", err);
            socket.emit("board-error", { message: "Server error while loading board" });
            //yha event emit hue hai to iska corresponding client mai likhna padega 
        }
    });
//updation jab bhi element change hoga server pai wo sabko updated dikhe thatswhy we are updating board
    socket.on("elements-update", async ({ boardId, elements }) => {
        if (!boardId || !Array.isArray(elements)) return;

        try {
            await Board.findByIdAndUpdate(
                boardId,
                { elements, updatedAt: new Date() }
            );
            socket.to(boardId).emit("elements-update", { elements });

        } catch (err) {

            console.error("Error saving elements to DB:", err);
        }
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

const PORT = process.env.PORT || 4444;
connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`Server Running on port ${PORT}`);
    });
});
