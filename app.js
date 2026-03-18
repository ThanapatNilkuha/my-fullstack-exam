const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const fs = require('fs');
const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

// --- เชื่อมต่อฐานข้อมูล SQLite ---
const sequelize = new Sequelize({ dialect: 'sqlite', storage: './database.sqlite' });
const Book = sequelize.define('Book', {
    name: DataTypes.STRING,
    price: DataTypes.INTEGER
});

// --- เส้นทางหน้าเว็บ (Routes) ---
app.get('/', (req, res) => { res.render('index'); });

app.post('/push', async (req, res) => {
    await Book.create({ name: req.body.name, price: req.body.price });
    res.redirect('/report');
});

app.get('/report', async (req, res) => {
    const books = await Book.findAll();
    res.render('report', { items: books });
});

// --- ฟังก์ชันรันระบบ (อัปเกรดให้จำข้อมูลได้ตลอดไป) ---
async function start() {
    // 💡 1. เอา { force: true } ออก เพื่อไม่ให้มันล้างข้อมูลเก่า
    await sequelize.sync(); 
    
    // 💡 2. ให้นับดูว่าในฐานข้อมูลมีหนังสือกี่เล่มแล้ว
    const count = await Book.count(); 

    // 💡 3. ถ้ายังไม่มีหนังสือเลย (นับได้ 0) ค่อยไปดูด JSON มาใส่
    if (count === 0) {
        const raw = fs.readFileSync('data.json');
        const data = JSON.parse(raw);
        await Book.bulkCreate(data);
        console.log('✅ ดูดข้อมูลจาก JSON เข้ามาครั้งแรกสำเร็จ!');
    } else {
        console.log('✅ ตรวจพบข้อมูลเดิมในระบบ พร้อมใช้งานต่อได้เลย!');
    }

    app.listen(3000, () => console.log('🚀 เปิดเว็บที่ http://localhost:3000'));
}
start();