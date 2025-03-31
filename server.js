const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const BASE_DIR = path.join(__dirname);
const COLLECTION_FILE = path.join(BASE_DIR, "collection.csv");

const parseCSV = (data) => {
    const lines = data.split("\n");
    const headers = lines[0].split(",");
    return lines.slice(1).map(line => {
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let char of line) {
            if (char === '"' && !inQuotes) {
                inQuotes = true;
            } else if (char === '"' && inQuotes) {
                inQuotes = false;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim()); // Add the last value

        return headers.reduce((obj, header, index) => {
            let value = values[index]?.replace(/\r?\n|\r/g, ""); // Remove new line characters
            if (!isNaN(value) && value !== "") { // Check if value is a valid number
                value = parseFloat(value);
            }
            obj[header.trim()] = value;
            return obj;
        }, {});
    });
};

const server = http.createServer((req, res) => {
    if (req.url === "/api/collection" && req.method === "GET") {
        fs.readFile(COLLECTION_FILE, "utf8", (err, data) => {
            if (err) {
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Failed to read collection file" }));
                return;
            }

            const collection = parseCSV(data);

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(collection));
        });
    } else {
        const filePath = path.join(BASE_DIR, req.url === "/" ? "index.html" : req.url);
        const ext = path.extname(filePath).toLowerCase();

        const mimeTypes = {
            ".html": "text/html",
            ".js": "application/javascript",
            ".css": "text/css",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".gif": "image/gif",
            ".svg": "image/svg+xml",
            ".json": "application/json",
        };

        const contentType = mimeTypes[ext] || "application/octet-stream";

        fs.readFile(filePath, (err, content) => {
            if (err) {
                if (err.code === "ENOENT") {
                    res.writeHead(404, { "Content-Type": "text/html" });
                    res.end("<h1>404 Not Found</h1>", "utf-8");
                } else {
                    res.writeHead(500, { "Content-Type": "text/html" });
                    res.end(`<h1>500 Server Error</h1><p>${err.message}</p>`, "utf-8");
                }
            } else {
                res.writeHead(200, { "Content-Type": contentType });
                res.end(content, "utf-8");
            }
        });
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
