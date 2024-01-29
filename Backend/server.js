import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { connect_db } from "./database_scripts/connect_to_database.js";
import { user_router } from "./api_routes/user_routes.js";
import { files_router } from "./api_routes/file_routes.js"
import { folder_router } from "./api_routes/folder_routes.js";
import { shared_items_router } from "./api_routes/shared_item_routes.js";

const app = express();
const PORT = process.env.SERVER_PORT;

await connect_db(process.env.DATABASE_URL);

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: false }));

app.use('', user_router);
app.use('', files_router);
app.use('', folder_router);
app.use('', shared_items_router);

app.listen(PORT, () => {
    return console.log(`Server is running at http://localhost:${PORT}`);
});