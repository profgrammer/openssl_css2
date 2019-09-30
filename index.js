const express = require('express');
const app = express();
const openssl = require('openssl-nodejs');
const multer = require('multer');
const upload = multer({dest: 'openssl/'});
const fs = require('fs');


app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('index.html');
})

app.post('/sign', upload.single('file'), (req, res) => {
    const f = req.file;
    openssl(`openssl dgst -md5 ${f.path}`, (err, buffer) => {
        let bfr = buffer.toString();
        bfr = bfr.replace(/(\r\n|\n|\r)/gm, "");
        bfr = bfr.split(' ');
        // bfr = bfr[1].substring(0, bfr[1].length-2);
        let sign = bfr[1];
        sign = sign.replace(/\\"/g, '"');
        const contents = fs.readFileSync(f.path).toString();
        const resp = {
            content: contents,
            signature: sign
        }
        fs.writeFileSync('output.json', JSON.stringify(resp));
        res.json(resp);
    })
})

app.post('/verify', upload.single('file'), (req, res) => {
    const f = req.file;
    const stream = fs.readFileSync(f.path).toString();
    const json = JSON.parse(stream);
    fs.writeFileSync('content.txt', json['content']);
    openssl(`openssl dgst -md5 content.txt`, (err, buffer) => {
        let bfr = buffer.toString();
        bfr = bfr.replace(/(\r\n|\n|\r)/gm, "");
        bfr = bfr.split(' ');
        // bfr = bfr[1].substring(0, bfr[1].length-2);
        let sign = bfr[1];
        sign = sign.replace(/\\"/g, '"');
        res.json({
            verified: sign === json['signature']
        });
    })
})

app.get('/download', (req, res) => {
    res.download('output.json');
})

app.listen(3000, () => console.log('listening on port 3000'));