import express from 'express';

const server = express();
const PORT = 3000;

server.listen(PORT, ()=> {
    console.log(`Listing on port ${PORT}`);
})